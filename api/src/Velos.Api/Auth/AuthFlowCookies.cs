using System.Globalization;
using Microsoft.AspNetCore.DataProtection;

namespace Velos.Api.Auth;

/// <summary>
/// Cookies de curta duração dos fluxos que saem do app e voltam: redefinição de senha (T19) e
/// Google (T20).
///
/// Todos são httpOnly E <b>protegidos com Data Protection</b>. O httpOnly só impede o JavaScript da
/// página de ler; não impede o dono do navegador de FORJAR um cookie na mão. Como o
/// <c>velos_pw_reset</c> é justamente o que autoriza trocar a senha sem saber a atual, um valor em
/// texto puro seria uma porta aberta para quem pegasse um computador com a sessão aberta.
/// A proteção é com prazo: o valor expira sozinho, mesmo que o cookie continue no navegador.
///
/// Os dois verifiers têm cookies e <b>propósitos diferentes</b> de propósito. Com um purpose só,
/// um código devolvido pelo Google poderia ser trocado em <c>/auth/confirm</c> e render um ticket de
/// redefinição — virando uma troca de senha sem saber a senha atual.
/// </summary>
/// <remarks>
/// Pública (e não <c>internal</c> como <see cref="SessionCookies"/>) só porque aparece na assinatura
/// das ações do controller, que o ASP.NET exige públicas.
/// </remarks>
public sealed class AuthFlowCookies(IDataProtectionProvider provider)
{
    private const string ResetVerifierName = "velos_pkce";
    private const string OAuthVerifierName = "velos_oauth";
    private const string TicketName = "velos_pw_reset";

    /// <summary>Os verifiers voltam em navegações para <c>/auth/*</c>, fora de <c>/api</c>.</summary>
    private const string FlowPath = "/";

    /// <summary>O ticket só é usado por <c>PUT /api/auth/password</c>.</summary>
    private const string TicketPath = "/api";

    /// <summary>Acompanha o prazo padrão do link do Supabase (mailer_otp_exp, 1 hora).</summary>
    private static readonly TimeSpan ResetVerifierLifetime = TimeSpan.FromHours(1);

    /// <summary>Tempo de ir ao Google, escolher a conta e voltar.</summary>
    private static readonly TimeSpan OAuthVerifierLifetime = TimeSpan.FromMinutes(15);

    /// <summary>Tempo de escolher e digitar uma senha nova, não mais do que isso.</summary>
    private static readonly TimeSpan TicketLifetime = TimeSpan.FromMinutes(15);

    private readonly ITimeLimitedDataProtector _reset =
        provider.CreateProtector("Velos.PasswordReset.Pkce").ToTimeLimitedDataProtector();

    private readonly ITimeLimitedDataProtector _oauth =
        provider.CreateProtector("Velos.Google.Pkce").ToTimeLimitedDataProtector();

    private readonly ITimeLimitedDataProtector _ticket =
        provider.CreateProtector("Velos.PasswordReset.Ticket").ToTimeLimitedDataProtector();

    public void WriteResetVerifier(HttpContext context, string verifier) =>
        Write(context, ResetVerifierName, FlowPath, _reset, verifier, ResetVerifierLifetime);

    public string? ReadResetVerifier(HttpContext context) =>
        Unprotect(_reset, context.Request.Cookies[ResetVerifierName]);

    public void ClearResetVerifier(HttpContext context) => Clear(context, ResetVerifierName, FlowPath);

    public void WriteOAuthVerifier(HttpContext context, string verifier) =>
        Write(context, OAuthVerifierName, FlowPath, _oauth, verifier, OAuthVerifierLifetime);

    public string? ReadOAuthVerifier(HttpContext context) =>
        Unprotect(_oauth, context.Request.Cookies[OAuthVerifierName]);

    public void ClearOAuthVerifier(HttpContext context) => Clear(context, OAuthVerifierName, FlowPath);

    /// <summary>Autoriza a troca de senha, e só para este usuário.</summary>
    public void WriteTicket(HttpContext context, Guid userId) =>
        Write(context, TicketName, TicketPath, _ticket, userId.ToString(), TicketLifetime);

    public Guid? ReadTicket(HttpContext context) =>
        Unprotect(_ticket, context.Request.Cookies[TicketName]) is { } value
        && Guid.TryParse(value, CultureInfo.InvariantCulture, out var userId)
            ? userId
            : null;

    public void ClearTicket(HttpContext context) => Clear(context, TicketName, TicketPath);

    private static void Write(
        HttpContext context, string name, string path, ITimeLimitedDataProtector protector, string value, TimeSpan lifetime) =>
        context.Response.Cookies.Append(name, protector.Protect(value, lifetime), Options(path, lifetime));

    private static void Clear(HttpContext context, string name, string path) =>
        context.Response.Cookies.Delete(name, Options(path, maxAge: null));

    /// <summary>Valor adulterado, de outro fluxo ou vencido é tratado como ausente — nunca como exceção.</summary>
    private static string? Unprotect(ITimeLimitedDataProtector protector, string? value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return null;
        }

        try
        {
            return protector.Unprotect(value);
        }
        catch (System.Security.Cryptography.CryptographicException)
        {
            return null;
        }
    }

    private static CookieOptions Options(string path, TimeSpan? maxAge) => new()
    {
        HttpOnly = true,
        Secure = true,
        // Lax: o cookie precisa sobreviver à volta do link do email e do Google, que são
        // navegações de cima (GET).
        SameSite = SameSiteMode.Lax,
        Path = path,
        MaxAge = maxAge,
        IsEssential = true,
    };
}
