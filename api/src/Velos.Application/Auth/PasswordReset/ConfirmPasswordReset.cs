using Velos.Application.Abstractions;
using Velos.Application.Common;

namespace Velos.Application.Auth.PasswordReset;

/// <summary>
/// Volta do link do email: troca o código pela sessão (PKCE). O código do Supabase vale poucos
/// minutos e só pode ser trocado UMA vez — é o que faz o mesmo link não funcionar duas vezes (CA7).
///
/// Sem o verifier (cookie perdido, outro navegador, link encaminhado para outra pessoa) a troca
/// falha: <see cref="PasswordResetErrors.InvalidLink"/>.
/// </summary>
public sealed class ConfirmPasswordResetHandler(IIdentityProvider identity)
{
    public async Task<Result<AuthSession>> HandleAsync(
        string? code, string? codeVerifier, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(codeVerifier))
        {
            return Result.Failure<AuthSession>(PasswordResetErrors.InvalidLink);
        }

        var session = await identity.ExchangeCodeAsync(code, codeVerifier, cancellationToken);

        // Qualquer recusa do Supabase vira "link inválido": o usuário não precisa saber se o
        // código expirou, já foi usado ou nunca existiu, e isso não muda o que ele tem a fazer.
        return session.IsSuccess || session.Error!.Kind == ErrorKind.Unavailable
            ? session
            : Result.Failure<AuthSession>(PasswordResetErrors.InvalidLink);
    }
}
