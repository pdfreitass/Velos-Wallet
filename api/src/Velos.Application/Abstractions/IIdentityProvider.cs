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
}
