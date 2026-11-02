using FluentValidation;
using Velos.Domain.Transactions;

namespace Velos.Application.Transactions;

/// <summary>O que criar e editar validam em comum. A descrição chega já sem os espaços das pontas.</summary>
public sealed record TransactionInput(
    TransactionType? Type,
    long AmountCents,
    DateOnly? Date,
    string? Description,
    Guid? AccountId,
    Guid? TransferAccountId,
    Guid? CategoryId);

/// <summary>
/// RN1, RN2, RN4 e RN5 com as MESMAS mensagens do Zod do front (<c>web/src/lib/validations/transactions.ts</c>).
/// Se a conta e a categoria são do usuário (RN10) o handler confere depois, no banco.
/// </summary>
public sealed class TransactionInputValidator : AbstractValidator<TransactionInput>
{
    public TransactionInputValidator(TimeProvider time)
    {
        ArgumentNullException.ThrowIfNull(time);

        RuleFor(input => input.Type).Cascade(CascadeMode.Stop)
            .NotNull().WithMessage("Escolha o tipo da transação")
            .IsInEnum().WithMessage("Escolha o tipo da transação");

        RuleFor(input => input.AmountCents).Cascade(CascadeMode.Stop)
            .GreaterThan(0).WithMessage("Informe um valor maior que zero")
            .LessThanOrEqualTo(TransactionRules.MaxAmountCents).WithMessage("O valor máximo é R$ 999.999.999,99");

        // "Hoje" é lido a cada validação: o validador é singleton-friendly e a meia-noite passa.
        RuleFor(input => input.Date).Cascade(CascadeMode.Stop)
            .NotNull().WithMessage("Informe a data")
            .Must(date => date!.Value >= TransactionRules.MinDate).WithMessage("Informe uma data a partir de 2000")
            .Must(date => TransactionRules.IsValidDate(date!.Value, TransactionRules.Today(time)))
                .WithMessage("A data não pode ser no futuro");

        RuleFor(input => input.Description)
            .Must(TransactionRules.IsValidDescription)
            .WithMessage($"A descrição pode ter no máximo {TransactionRules.DescriptionMaxLength} caracteres");

        RuleFor(input => input.AccountId)
            .NotNull().WithMessage("Escolha a conta");

        When(input => input.Type == TransactionType.Transfer, () =>
        {
            RuleFor(input => input.TransferAccountId).Cascade(CascadeMode.Stop)
                .NotNull().WithMessage("Escolha a conta de destino")
                .Must((input, target) => target != input.AccountId)
                    .WithMessage("Escolha uma conta diferente da de origem");
        });

        When(input => input.Type is TransactionType.Expense or TransactionType.Income, () =>
        {
            RuleFor(input => input.CategoryId)
                .NotNull()
                .WithMessage(input => CategoryMessage(input.Type!.Value));
        });
    }

    /// <summary>Também usada pelo handler quando a categoria existe mas é do outro tipo.</summary>
    public static string CategoryMessage(TransactionType type) =>
        type == TransactionType.Income ? "Escolha uma categoria de receita" : "Escolha uma categoria de despesa";
}
