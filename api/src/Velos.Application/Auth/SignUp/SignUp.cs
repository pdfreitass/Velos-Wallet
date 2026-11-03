using FluentValidation;
using Velos.Application.Abstractions;
using Velos.Application.Auth;
using Velos.Application.Common;
using Velos.Domain.Auth;

namespace Velos.Application.Auth.SignUp;

public sealed record SignUpCommand(string Name, string Email, string Password, string ConfirmPassword);

/// <summary>
/// Cadastro aceito de duas formas (spec 013): sessão direta (confirmação desligada, ex.: dev) ou
/// pendente — sem sessão, com o verifier do PKCE para a API gravar no cookie httpOnly.
/// </summary>
public sealed record SignUpStarted(AuthSession? Session, string? CodeVerifier);

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
/// Cadastro (H1 da spec 001 + spec 013). Sempre com PKCE: com "Confirm email" desligado o Supabase
/// devolve a sessão e o challenge é ignorado; ligado, devolve <c>ConfirmationRequired</c> e o
/// verifier volta para a API gravar no cookie. O banco cria o perfil e as 10 categorias padrão
/// pelo trigger handle_new_user (RN9, RN10).
/// </summary>
public sealed class SignUpHandler(IValidator<SignUpCommand> validator, IIdentityProvider identity)
{
    public async Task<Result<SignUpStarted>> HandleAsync(
        SignUpCommand command, string redirectTo, CancellationToken cancellationToken)
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
            return Result.Failure<SignUpStarted>(ValidationErrors.From(validation));
        }

        var pkce = PkcePair.Create();
        var result = await identity.SignUpAsync(
            input.Name, input.Email, input.Password, pkce.Challenge, redirectTo, cancellationToken);

        if (result.IsSuccess)
        {
            return Result.Success(new SignUpStarted(result.Value, null));
        }

        // Sem sessão no cadastro = o projeto exige confirmação por email: quem volta é o verifier.
        if (result.Error!.Code == AuthErrors.ConfirmationRequired.Code)
        {
            return Result.Success(new SignUpStarted(null, pkce.Verifier));
        }

        return Result.Failure<SignUpStarted>(result.Error);
    }
}
