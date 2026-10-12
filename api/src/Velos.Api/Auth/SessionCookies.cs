using Velos.Application.Auth;

namespace Velos.Api.Auth;

/// <summary>
/// Sessão em cookies httpOnly (ADR 0013): o JavaScript da página nunca enxerga os tokens.
/// SameSite=Lax + header CSRF obrigatório nas mutações (<see cref="CsrfHeaderMiddleware"/>).
/// </summary>
internal static class SessionCookies
{
    public const string AccessToken = "velos_at";
    public const string RefreshToken = "velos_rt";

    /// <summary>O refresh token só viaja para a API, nunca para as páginas do SPA.</summary>
    private const string RefreshTokenPath = "/api";

    private static readonly TimeSpan RefreshTokenLifetime = TimeSpan.FromDays(30);

    /// <summary>Token renovado NESTA request (o cookie novo só chega ao navegador na resposta).</summary>
    private const string FreshAccessTokenItem = "velos.fresh_access_token";

    public static void Write(HttpContext context, AuthSession session)
    {
        context.Response.Cookies.Append(
            AccessToken, session.AccessToken, Options("/", TimeSpan.FromSeconds(session.ExpiresInSeconds)));
        context.Response.Cookies.Append(
            RefreshToken, session.RefreshToken, Options(RefreshTokenPath, RefreshTokenLifetime));
        context.Items[FreshAccessTokenItem] = session.AccessToken;
    }

    public static void Clear(HttpContext context)
    {
        context.Response.Cookies.Delete(AccessToken, Options("/", maxAge: null));
        context.Response.Cookies.Delete(RefreshToken, Options(RefreshTokenPath, maxAge: null));
        context.Items.Remove(FreshAccessTokenItem);
    }

    public static string? ReadAccessToken(HttpContext context) =>
        context.Items[FreshAccessTokenItem] as string ?? context.Request.Cookies[AccessToken];

    public static string? ReadRefreshToken(HttpContext context) => context.Request.Cookies[RefreshToken];

    private static CookieOptions Options(string path, TimeSpan? maxAge) => new()
    {
        HttpOnly = true,
        Secure = true, // localhost conta como contexto seguro: funciona em http://localhost:3000
        SameSite = SameSiteMode.Lax,
        Path = path,
        MaxAge = maxAge,
        IsEssential = true,
    };
}
