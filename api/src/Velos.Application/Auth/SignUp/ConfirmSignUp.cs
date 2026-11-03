using Velos.Application.Abstractions;
using Velos.Application.Common;
using Velos.Domain.Auth;

namespace Velos.Application.Auth.SignUp;

/// <summary>
/// Volta do link do email de confirmação: troca o código pela sessão (PKCE, spec 013). O código
/// do Supabase vale poucos minutos e só pode ser trocado UMA vez — o mesmo link não confirma duas
/// vezes. Sem o verifier (cookie perdido, outro navegador, link encaminhado) a troca falha com
/// <see cref="SignUpConfirmationErrors.InvalidLink"/>.
/// </summary>
public sealed class ConfirmSignUpHandler(IIdentityProvider identity)
{
    public async Task<Result<AuthSession>> HandleAsync(
        string? code, string? codeVerifier, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(codeVerifier))
        {
            return Result.Failure<AuthSession>(SignUpConfirmationErrors.InvalidLink);
        }

        var session = await identity.ExchangeCodeAsync(code, codeVerifier, cancellationToken);

        // Qualquer recusa vira "link inválido" (não interessa se expirou, foi usado ou nunca
        // existiu); serviço fora do ar continua sendo "fora do ar" para o erro não mentir.
        return session.IsSuccess || session.Error!.Kind == ErrorKind.Unavailable
            ? session
            : Result.Failure<AuthSession>(SignUpConfirmationErrors.InvalidLink);
    }
}
