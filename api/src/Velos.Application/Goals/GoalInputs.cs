using FluentValidation;
using Velos.Domain.Goals;
using Velos.Domain.Transactions;

namespace Velos.Application.Goals;

/// <summary>
/// O que criar e editar a meta validam. <see cref="CurrentDeadline"/> é o prazo gravado (na criação,
/// <c>null</c>): com ele, editar uma meta vencida não obriga a trocar o prazo (RN2).
/// </summary>
public sealed record GoalInput(string? Name, long TargetCents, DateOnly? Deadline, DateOnly? CurrentDeadline = null);

/// <summary>RN1 e RN2 com as MESMAS mensagens do Zod do front (<c>web/src/lib/validations/goals.ts</c>).</summary>
public sealed class GoalInputValidator : AbstractValidator<GoalInput>
{
    public GoalInputValidator(TimeProvider time)
    {
        ArgumentNullException.ThrowIfNull(time);

        RuleFor(input => input.Name).Cascade(CascadeMode.Stop)
            .Must(name => !string.IsNullOrWhiteSpace(name)).WithMessage("Informe o nome da meta")
            .Must(GoalRules.IsValidName).WithMessage($"O nome pode ter no máximo {GoalRules.NameMaxLength} caracteres");

        RuleFor(input => input.TargetCents).Cascade(CascadeMode.Stop)
            .GreaterThan(0).WithMessage("Informe um valor maior que zero")
            .LessThanOrEqualTo(GoalRules.MaxAmountCents).WithMessage("O valor máximo é R$ 999.999.999,99");

        // "Hoje" é lido a cada validação: a meia-noite passa.
        RuleFor(input => input.Deadline).Cascade(CascadeMode.Stop)
            .Must(deadline => deadline is not { } value || value <= GoalRules.MaxDeadline)
                .WithMessage("Informe um prazo até 2100")
            .Must((input, deadline) => GoalRules.IsValidDeadline(deadline, TransactionRules.Today(time), input.CurrentDeadline))
                .WithMessage("O prazo não pode ser no passado");
    }
}

/// <summary>Aporte: valor e data (RN3).</summary>
public sealed record ContributionInput(long AmountCents, DateOnly? Date);

/// <summary>RN3 com as MESMAS mensagens das transações e do Zod do front.</summary>
public sealed class ContributionInputValidator : AbstractValidator<ContributionInput>
{
    public ContributionInputValidator(TimeProvider time)
    {
        ArgumentNullException.ThrowIfNull(time);

        RuleFor(input => input.AmountCents).Cascade(CascadeMode.Stop)
            .GreaterThan(0).WithMessage("Informe um valor maior que zero")
            .LessThanOrEqualTo(GoalRules.MaxAmountCents).WithMessage("O valor máximo é R$ 999.999.999,99");

        RuleFor(input => input.Date).Cascade(CascadeMode.Stop)
            .NotNull().WithMessage("Informe a data")
            .Must(date => date!.Value >= TransactionRules.MinDate).WithMessage("Informe uma data a partir de 2000")
            .Must(date => GoalRules.IsValidContributionDate(date!.Value, TransactionRules.Today(time)))
                .WithMessage("A data não pode ser no futuro");
    }
}
