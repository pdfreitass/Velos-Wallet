using FluentValidation;
using Velos.Application.Abstractions;
using Velos.Application.Common;
using Velos.Domain.Auth;

namespace Velos.Application.Auth.SignUp;

public sealed record SignUpCommand(string Name, string Email, string Password, string ConfirmPassword);

public sealed class SignUpValidator : AbstractValidator<SignUpCommand>
{
    public SignUpValidator()
    {
        RuleFor(command => command.Name).Cascade(CascadeMode.Stop).ValidName();
        RuleFor(command => command.Email).Cascade(CascadeMode.Stop).ValidEmail();
        RuleFor(command => command.Password).Cascade(CascadeMode.Stop).StrongPassword();

        // RN2: a senha digitada duas vezes; o erro aparece no segundo campo.
        RuleFor(command => command.ConfirmPassword).Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Confirme sua senha")
            .Equal(command => command.Password).WithMessage("As senhas não coincidem");
    }
}

/// <summary>
/// Cadastro (H1). Sem confirmação por email (Revisão 1 da spec 001): o Supabase já devolve a
/// sessão. O banco cria o perfil e as 10 categorias padrão pelo trigger handle_new_user (RN9, RN10).
/// </summary>
public sealed class SignUpHandler(IValidator<SignUpCommand> validator, IIdentityProvider identity)
{
    public async Task<Result<AuthSession>> HandleAsync(SignUpCommand command, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        var input = command with
        {
            Name = (command.Name ?? string.Empty).Trim(),
            Email = EmailAddress.Normalize(command.Email),
            Password = command.Password ?? string.Empty,
            ConfirmPassword = command.ConfirmPassword ?? string.Empty,
        };

        var validation = await validator.ValidateAsync(input, cancellationToken);
        if (!validation.IsValid)
        {
            return Result.Failure<AuthSession>(ValidationErrors.From(validation));
        }

        return await identity.SignUpAsync(input.Name, input.Email, input.Password, cancellationToken);
    }
}
