using FluentValidation;
using Velos.Application.Abstractions;
using Velos.Application.Common;
using Velos.Domain.Auth;

namespace Velos.Application.Auth.SignUp;

public sealed record RequestSignUpConfirmationCommand(string Email);

/// <summary>
/// O verifier volta para a API gravar no cookie httpOnly, nunca em JSON: quem tiver o verifier e
/// o link do email confirma a conta.
/// </summary>
public sealed record SignUpConfirmationStarted(string CodeVerifier);

public sealed class RequestSignUpConfirmationValidator : AbstractValidator<RequestSignUpConfirmationCommand>
{
    public RequestSignUpConfirmationValidator() =>
        RuleFor(command => command.Email).Cascade(CascadeMode.Stop).ValidEmail();
}

/// <summary>
/// Reenvio do email de confirmação (spec 013, RN4). Resposta NEUTRA: existindo cadastro pendente,
/// já confirmado ou não existindo, a resposta é a mesma. Única exceção: Supabase fora do ar, que
/// sobe como erro — fingir "enviamos" com o serviço fora seria mentir para o usuário.
/// </summary>
public sealed class RequestSignUpConfirmationHandler(
    IValidator<RequestSignUpConfirmationCommand> validator,
    IIdentityProvider identity)
{
    public async Task<Result<SignUpConfirmationStarted>> HandleAsync(
        RequestSignUpConfirmationCommand command, string redirectTo, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        var input = command with { Email = EmailAddress.Normalize(command.Email) };

        var validation = await validator.ValidateAsync(input, cancellationToken);
        if (!validation.IsValid)
        {
            return Result.Failure<SignUpConfirmationStarted>(ValidationErrors.From(validation));
        }

        var pkce = PkcePair.Create();
        var sent = await identity.SendSignupConfirmationAsync(
            input.Email, pkce.Challenge, redirectTo, cancellationToken);

        // RN4: só serviço fora do ar sobe; qualquer outra resposta do Supabase (inclusive "já
        // confirmado" ou "não existe") vira o mesmo sucesso neutro.
        //
        // O limite de envios do GoTrue NÃO pode subir, ao contrário do que esta linha dizia antes:
        // o `SMTP_MAX_FREQUENCY` é POR USUÁRIO. Dois reenvios seguidos para um email COM cadastro
        // pendente dariam 429; para um email SEM cadastro não há usuário, não há frequência, e a
        // resposta seria 202. Isso é um oráculo binário de "este email tem conta aqui" — justo o
        // que a RN4 existe para impedir. Quem freia abuso aqui é a política por IP da API
        // (RateLimitingSetup.SignUpResend), que não depende de o email existir.
        var neutral = sent.IsSuccess || sent.Error!.Kind is not ErrorKind.Unavailable;

        return neutral
            ? Result.Success(new SignUpConfirmationStarted(pkce.Verifier))
            : Result.Failure<SignUpConfirmationStarted>(sent.Error!);
    }
}
