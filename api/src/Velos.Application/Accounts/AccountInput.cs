using FluentValidation;
using Velos.Domain.Accounts;

namespace Velos.Application.Accounts;

/// <summary>
/// O que criar e editar validam em comum. Na criação o tipo é o escolhido; na edição, o da conta
/// salva (o saldo é validado contra ele, RN3). O nome chega já sem os espaços das pontas.
/// </summary>
public sealed record AccountInput(string Name, AccountType? Type, long InitialBalanceCents);

/// <summary>
/// RN1–RN3 com as MESMAS mensagens do Zod do front (<c>web/src/lib/validations/accounts.ts</c>).
/// Os limites vêm do <see cref="AccountRules"/>.
/// </summary>
public sealed class AccountInputValidator : AbstractValidator<AccountInput>
{
    public AccountInputValidator()
    {
        RuleFor(input => input.Name).Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Informe o nome da conta")
            .MaximumLength(AccountRules.NameMaxLength)
                .WithMessage($"O nome pode ter no máximo {AccountRules.NameMaxLength} caracteres");

        RuleFor(input => input.Type).Cascade(CascadeMode.Stop)
            .NotNull().WithMessage("Escolha o tipo da conta")
            .IsInEnum().WithMessage("Escolha o tipo da conta");

        RuleFor(input => input.InitialBalanceCents).Cascade(CascadeMode.Stop)
            .InclusiveBetween(-AccountRules.MaxBalanceCents, AccountRules.MaxBalanceCents)
                .WithMessage("O valor máximo é R$ 999.999.999,99")
            .Must((input, cents) => input.Type is not { } type
                                    || !Enum.IsDefined(type)
                                    || AccountRules.IsValidInitialBalance(type, cents))
                .WithMessage(input => input.Type == AccountType.CreditCard
                    ? "No cartão, informe quanto você deve (o valor vira dívida)"
                    : "O saldo inicial não pode ser negativo");
    }
}
