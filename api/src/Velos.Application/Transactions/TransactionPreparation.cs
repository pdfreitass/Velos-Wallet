using FluentValidation;
using Velos.Application.Abstractions;
using Velos.Application.Common;
using Velos.Domain.Categories;
using Velos.Domain.Transactions;

namespace Velos.Application.Transactions;

/// <summary>
/// O caminho comum de criar e editar: normaliza, valida (RN1–RN5) e confere no banco que a conta,
/// a conta de destino e a categoria são do usuário e do tipo certo (RN10). Só devolve
/// <see cref="TransactionData"/> quando tudo bate; as FKs compostas do banco são a segunda barreira.
/// </summary>
internal static class TransactionPreparation
{
    public static async Task<Result<TransactionData>> PrepareAsync(
        IValidator<TransactionInput> validator,
        ITransactionStore store,
        Guid userId,
        TransactionInput raw,
        CancellationToken cancellationToken)
    {
        var input = Normalize(raw);

        var validation = await validator.ValidateAsync(input, cancellationToken);
        if (!validation.IsValid) return Result.Failure<TransactionData>(ValidationErrors.From(validation));

        var type = input.Type!.Value;
        var refs = await store.GetReferencesAsync(
            userId, input.AccountId!.Value, input.TransferAccountId, input.CategoryId, cancellationToken);
        if (!refs.IsSuccess) return Result.Failure<TransactionData>(refs.Error!);

        if (ReferenceError(type, refs.Value) is { } error) return Result.Failure<TransactionData>(error);

        return Result.Success(new TransactionData(
            type, input.AmountCents, input.Date!.Value, input.Description,
            input.AccountId.Value, input.TransferAccountId, input.CategoryId));
    }

    /// <summary>
    /// Descrição vazia vira <c>null</c>. Transferência não tem categoria e despesa/receita não têm
    /// conta de destino (RN1): o que sobrar do formulário é descartado em vez de recusado.
    /// </summary>
    private static TransactionInput Normalize(TransactionInput input)
    {
        var description = input.Description?.Trim();
        var isTransfer = input.Type == TransactionType.Transfer;

        return input with
        {
            Description = string.IsNullOrEmpty(description) ? null : description,
            CategoryId = isTransfer ? null : input.CategoryId,
            TransferAccountId = isTransfer ? input.TransferAccountId : null,
        };
    }

    private static AppError? ReferenceError(TransactionType type, TransactionReferences refs)
    {
        if (!refs.AccountFound) return ValidationErrors.Field("accountId", TransactionErrors.AccountNotFound);

        if (type == TransactionType.Transfer)
        {
            return refs.TransferAccountFound
                ? null
                : ValidationErrors.Field("transferAccountId", TransactionErrors.AccountNotFound);
        }

        var expected = type == TransactionType.Income ? CategoryType.Income : CategoryType.Expense;
        return refs.CategoryType == expected
            ? null
            : ValidationErrors.Field("categoryId", TransactionInputValidator.CategoryMessage(type));
    }
}
