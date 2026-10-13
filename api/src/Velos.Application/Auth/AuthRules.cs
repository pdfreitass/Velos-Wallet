using FluentValidation;
using Velos.Domain.Auth;

namespace Velos.Application.Auth;

/// <summary>
/// Regras de campo da autenticação, com as MESMAS mensagens do Zod do front
/// (<c>web/src/lib/validations/auth.ts</c>). O front valida para a experiência; quem decide é a API.
/// </summary>
internal static class AuthRules
{
    public static IRuleBuilderOptions<T, string> ValidEmail<T>(this IRuleBuilder<T, string> rule) =>
        rule.NotEmpty().WithMessage("Informe seu email")
            .MaximumLength(EmailAddress.MaxLength).WithMessage("Email muito longo")
            .EmailAddress().WithMessage("Informe um email válido");

    public static IRuleBuilderOptions<T, string> ValidName<T>(this IRuleBuilder<T, string> rule) =>
        rule.NotEmpty().WithMessage("Informe seu nome")
            .MinimumLength(2).WithMessage("O nome precisa ter pelo menos 2 letras")
            .MaximumLength(80).WithMessage("O nome pode ter no máximo 80 caracteres");

    /// <summary>RN1: senha nova (cadastro e redefinição).</summary>
    public static IRuleBuilderOptions<T, string> StrongPassword<T>(this IRuleBuilder<T, string> rule) =>
        rule.MaximumLength(PasswordPolicy.MaxLength)
                .WithMessage($"A senha pode ter no máximo {PasswordPolicy.MaxLength} caracteres")
            .Must(password => PasswordPolicy.UnmetRequirements(password ?? string.Empty).Count == 0)
                .WithMessage((_, password) => "A senha precisa ter: " + string.Join(", ",
                    PasswordPolicy.UnmetRequirements(password ?? string.Empty).Select(Describe)));

    /// <summary>Mesmos textos do checklist da tela (em minúsculas, como na mensagem do Zod).</summary>
    public static string Describe(PasswordRequirement requirement) => requirement switch
    {
        PasswordRequirement.MinLength => $"pelo menos {PasswordPolicy.MinLength} caracteres",
        PasswordRequirement.Lowercase => "uma letra minúscula",
        PasswordRequirement.Uppercase => "uma letra maiúscula",
        PasswordRequirement.Number => "um número",
        PasswordRequirement.Symbol => "um caractere especial (ex.: ! @ # $ %)",
        _ => throw new ArgumentOutOfRangeException(nameof(requirement), requirement, null),
    };
}
