using Microsoft.IdentityModel.JsonWebTokens;
using Velos.Application.Abstractions;
using Velos.Application.Common;

namespace Velos.Api.Auth;

/// <summary>
/// Renova a sessão antes da autenticação: se o access token falta ou vence em menos de 1 minuto
/// e existe refresh token, pede um novo par ao Supabase e regrava os cookies.
/// </summary>
internal sealed class TokenRefreshMiddleware(RequestDelegate next)
{
    private static readonly TimeSpan RefreshMargin = TimeSpan.FromMinutes(1);
    private static readonly JsonWebTokenHandler TokenReader = new();

    public async Task InvokeAsync(HttpContext context, IIdentityProvider identity, TimeProvider time)
    {
        if (ShouldTryRefresh(context, time.GetUtcNow())
            && SessionCookies.ReadRefreshToken(context) is { Length: > 0 } refreshToken)
        {
            var refreshed = await identity.RefreshAsync(refreshToken, context.RequestAborted);
            if (refreshed.IsSuccess)
            {
                SessionCookies.Write(context, refreshed.Value);
            }
            else if (refreshed.Error!.Kind == ErrorKind.Unauthorized)
            {
                // Refresh revogado ou expirado: a sessão acabou de vez.
                SessionCookies.Clear(context);
            }

            // Supabase fora do ar: segue sem renovar; se o token já venceu, a request cai em 401.
        }

        await next(context);
    }

    private static bool ShouldTryRefresh(HttpContext context, DateTimeOffset now)
    {
        var path = context.Request.Path;
        if (!path.StartsWithSegments("/api") || path.StartsWithSegments("/api/auth") || path.StartsWithSegments("/api/health"))
        {
            return false;
        }

        var accessToken = context.Request.Cookies[SessionCookies.AccessToken];
        if (string.IsNullOrEmpty(accessToken) || !TokenReader.CanReadToken(accessToken))
        {
            return true;
        }

        // Só lê a validade, sem conferir a assinatura: quem valida o token é o JwtBearer, logo depois.
        return TokenReader.ReadJsonWebToken(accessToken).ValidTo <= now.UtcDateTime + RefreshMargin;
    }
}
