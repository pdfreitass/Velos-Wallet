using Velos.Application.Abstractions;
using Velos.Application.Common;
using Velos.Domain.Auth;

namespace Velos.Application.Auth.Google;

/// <summary>
/// O verifier vai para um cookie httpOnly; a URL é para onde o navegador deve ser redirecionado.
/// </summary>
public sealed record GoogleSignInStarted(string CodeVerifier, Uri AuthorizeUrl);

public static class GoogleErrors
{
    /// <summary>
    /// Cancelou no Google, o provedor recusou ou o código não serve. Um texto só: o usuário não
    /// precisa saber qual dos três foi, e em todos a saída é a mesma.
    /// </summary>
    public static readonly AppError Failed = new(
        "google_failed", ErrorKind.Forbidden,
        "Não foi possível entrar com o Google. Tente de novo ou use seu email e senha.");
}

/// <summary>
/// Começa o login com Google (H4) em PKCE, igual à recuperação de senha: o verifier fica no
/// navegador e só o hash viaja.
/// </summary>
public sealed class StartGoogleSignInHandler(IIdentityProvider identity)
{
    public GoogleSignInStarted Handle(string redirectTo)
    {
        var pkce = PkcePair.Create();
        return new GoogleSignInStarted(pkce.Verifier, identity.BuildGoogleAuthorizeUrl(pkce.Challenge, redirectTo));
    }
}

/// <summary>
/// Volta do Google. Quem entra pela primeira vez tem perfil e categorias criados pelo trigger
/// <c>handle_new_user</c>, com o nome da conta Google (RN9, RN10); quem já tinha conta com o mesmo
/// email cai na MESMA conta, porque quem resolve isso é o Supabase (RN11).
/// </summary>
public sealed class CompleteGoogleSignInHandler(IIdentityProvider identity)
{
    public async Task<Result<AuthSession>> HandleAsync(
        string? code, string? codeVerifier, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(codeVerifier))
        {
            return Result.Failure<AuthSession>(GoogleErrors.Failed);
        }

        var session = await identity.ExchangeCodeAsync(code, codeVerifier, cancellationToken);

        // Fora do ar mantém o próprio erro: "tente de novo com email e senha" não ajudaria.
        return session.IsSuccess || session.Error!.Kind == ErrorKind.Unavailable
            ? session
            : Result.Failure<AuthSession>(GoogleErrors.Failed);
    }
}
