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

    /// <summary>
    /// Cria a conta (spec 013). Com "Confirm email" desligado (dev), já devolve a sessão; ligado,
    /// devolve <see cref="AuthErrors.ConfirmationRequired"/> e o email leva o link PKCE com
    /// <c>redirectTo</c>. Com <c>codeChallenge</c> nulo, comporta-se como antes da spec 013.
    /// </summary>
    Task<Result<AuthSession>> SignUpAsync(
        string name, string email, string password, string? codeChallenge, string? redirectTo, CancellationToken cancellationToken);

    /// <summary>
    /// Reenvia o email de confirmação de cadastro (spec 013, RN4). Mesmo formato PKCE do cadastro:
    /// o link volta com <c>?code=</c> na query para o <c>redirectTo</c>.
    /// </summary>
    Task<Result<Unit>> SendSignupConfirmationAsync(
        string email, string codeChallenge, string redirectTo, CancellationToken cancellationToken);

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
