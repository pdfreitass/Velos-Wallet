using FluentValidation;
using Velos.Application.Abstractions;
using Velos.Application.Common;
using Velos.Domain.Transactions;

namespace Velos.Application.Transactions;

/// <summary>Valor sempre positivo; o sentido vem do tipo (RN2). Não há campo de usuário: o dono é o do JWT.</summary>
public sealed record SaveTransactionCommand(
    TransactionType? Type,
    long AmountCents,
    DateOnly? Date,
    string? Description,
    Guid? AccountId,
    Guid? TransferAccountId,
    Guid? CategoryId)
{
    internal TransactionInput ToInput() =>
        new(Type, AmountCents, Date, Description, AccountId, TransferAccountId, CategoryId);
}

public sealed class CreateTransactionHandler(
    IValidator<TransactionInput> validator, IUserContext user, ITransactionStore transactions)
{
    public async Task<Result<Guid>> HandleAsync(SaveTransactionCommand command, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        var userId = user.UserId;

        var data = await TransactionPreparation.PrepareAsync(validator, transactions, userId, command.ToInput(), cancellationToken);
        if (!data.IsSuccess) return Result.Failure<Guid>(data.Error!);

        return await transactions.CreateAsync(userId, data.Value, cancellationToken);
    }
}

/// <summary>RN8: muda tudo, mas o tipo só troca entre despesa e receita.</summary>
public sealed class UpdateTransactionHandler(
    IValidator<TransactionInput> validator, IUserContext user, ITransactionStore transactions)
{
    public async Task<Result<Unit>> HandleAsync(Guid transactionId, SaveTransactionCommand command, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        var userId = user.UserId;

        var found = await transactions.GetAsync(userId, transactionId, cancellationToken);
        if (!found.IsSuccess) return Result.Failure<Unit>(found.Error!);
        if (found.Value is not { } current) return Result.Failure<Unit>(TransactionErrors.NotFound);

        if (command.Type is { } newType && Enum.IsDefined(newType) && !TransactionRules.CanChangeType(current.Type, newType))
        {
            return Result.Failure<Unit>(ValidationErrors.Field("type", TransactionErrors.TypeChangeNotAllowed));
        }

        var data = await TransactionPreparation.PrepareAsync(validator, transactions, userId, command.ToInput(), cancellationToken);
        if (!data.IsSuccess) return Result.Failure<Unit>(data.Error!);

        var updated = await transactions.UpdateAsync(userId, transactionId, data.Value, cancellationToken);
        if (!updated.IsSuccess) return Result.Failure<Unit>(updated.Error!);

        // Sumiu entre a leitura e a gravação (excluída em outra aba).
        return updated.Value ? Result.Ok() : Result.Failure<Unit>(TransactionErrors.NotFound);
    }
}
