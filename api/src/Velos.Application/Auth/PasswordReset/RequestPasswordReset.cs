using FluentValidation;
using Velos.Application.Abstractions;
using Velos.Application.Common;
using Velos.Domain.Auth;

namespace Velos.Application.Auth.PasswordReset;

public sealed record RequestPasswordResetCommand(string Email);

/// <summary>
/// O verifier volta para a API gravar no cookie httpOnly. Ele NÃO vai para o navegador em JSON:
/// quem tiver o verifier e o link do email consegue a sessão.
/// </summary>
public sealed record PasswordResetStarted(string CodeVerifier);

public sealed class RequestPasswordResetValidator : AbstractValidator<RequestPasswordResetCommand>
{
    public RequestPasswordResetValidator() =>
        RuleFor(command => command.Email).Cascade(CascadeMode.Stop).ValidEmail();
}

/// <summary>
/// "Esqueci minha senha" (H5, RN6). Resposta NEUTRA (RN4): existindo conta ou não, o usuário vê a
/// mesma tela. O Supabase também responde igual nos dois casos, então nada aqui revela nada.
///
/// Exceção à neutralidade: limite de envios e Supabase fora do ar sobem como erro. Nenhum dos dois
/// depende do email ter conta, e fingir "enviamos" com o serviço fora seria mentir para o usuário.
/// </summary>
public sealed class RequestPasswordResetHandler(
    IValidator<RequestPasswordResetCommand> validator,
    IIdentityProvider identity)
{
    public async Task<Result<PasswordResetStarted>> HandleAsync(
        RequestPasswordResetCommand command, string redirectTo, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        var input = command with { Email = EmailAddress.Normalize(command.Email) };

        var validation = await validator.ValidateAsync(input, cancellationToken);
        if (!validation.IsValid)
        {
            return Result.Failure<PasswordResetStarted>(ValidationErrors.From(validation));
        }

        var pkce = PkcePair.Create();
        var sent = await identity.SendPasswordResetAsync(input.Email, pkce.Challenge, redirectTo, cancellationToken);

        return sent.IsSuccess
            ? Result.Success(new PasswordResetStarted(pkce.Verifier))
            : Result.Failure<PasswordResetStarted>(sent.Error!);
    }
}
