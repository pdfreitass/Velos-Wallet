using Velos.Application.Auth;
using Velos.Application.Common;

namespace Velos.Application.Abstractions;

/// <summary>
/// Provedor de identidade (Supabase Auth). A implementação traduz os erros dele para
/// <see cref="AuthErrors"/>: nenhuma mensagem do Supabase passa daqui para cima.
/// </summary>
public interface IIdentityProvider
{
    Task<Result<AuthSession>> SignInWithPasswordAsync(string email, string password, CancellationToken cancellationToken);

    /// <summary>Cria a conta. Com "Confirm email" desligado (Revisão 1), já devolve a sessão.</summary>
    Task<Result<AuthSession>> SignUpAsync(string name, string email, string password, CancellationToken cancellationToken);

    Task<Result<AuthSession>> RefreshAsync(string refreshToken, CancellationToken cancellationToken);

    /// <summary>Revoga a sessão no servidor (RN12). Melhor esforço: falha não impede o "Sair".</summary>
    Task SignOutAsync(string accessToken, CancellationToken cancellationToken);

    /// <summary>
    /// Dispara o email de recuperação (RN6) em fluxo PKCE: o link volta com <c>?code=</c> na query,
    /// que o servidor consegue ler. Não diz se o email tem conta — o próprio Supabase responde igual
    /// nos dois casos (RN4).
    /// </summary>
    Task<Result<Unit>> SendPasswordResetAsync(
        string email, string codeChallenge, string redirectTo, CancellationToken cancellationToken);

    /// <summary>Troca o código do link pela sessão, provando a posse do verifier (PKCE).</summary>
    Task<Result<AuthSession>> ExchangeCodeAsync(string code, string codeVerifier, CancellationToken cancellationToken);

    /// <summary>Grava a senha nova do usuário da sessão.</summary>
    Task<Result<Unit>> UpdatePasswordAsync(string accessToken, string newPassword, CancellationToken cancellationToken);

    /// <summary>
    /// Endereço do Supabase para onde mandar o navegador começar o login com Google (H4). O segredo
    /// do Google fica no painel do Supabase: nem o Client ID nem o Secret passam por aqui.
    /// </summary>
    Uri BuildGoogleAuthorizeUrl(string codeChallenge, string redirectTo);
}
