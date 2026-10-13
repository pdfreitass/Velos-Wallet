using Velos.Application.Abstractions;

namespace Velos.Application.Auth.SignOut;

/// <summary>
/// RN12: "Sair" revoga a sessão no Supabase, não só apaga cookies. É melhor esforço:
/// mesmo que a revogação falhe ou não haja token, a API apaga os cookies.
/// </summary>
public sealed class SignOutHandler(IIdentityProvider identity)
{
    public async Task HandleAsync(string? accessToken, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrEmpty(accessToken))
        {
            await identity.SignOutAsync(accessToken, cancellationToken);
        }
    }
}
