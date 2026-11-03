using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Net.Http.Headers;
using Velos.Application.Auth;
using Velos.Application.Common;
using Velos.Domain.Auth;

namespace Velos.Api.Tests.Auth;

/// <summary>
/// Spec 013 (T3): cadastro e reenvio na API — 201 com o verifier só no cookie httpOnly quando a
/// confirmação é exigida, sessão direta em dev, reenvio neutro (RN4) e limpeza no SignOut.
/// </summary>
public class SignUpResendApiTests
{
    private const string SignUpVerifier = "velos_signup";
    private const string AccessToken = "velos_at";
    private const string RefreshToken = "velos_rt";

    private const string SignUpPath = "/api/auth/sign-up";
    private const string ResendPath = "/api/auth/sign-up/resend";
    private const string SignOutPath = "/api/auth/sign-out";

    private static object SignUpBody => new
    {
        name = "Pedro",
        email = "pedro@example.com",
        password = "Pedro10@",
        confirmPassword = "Pedro10@",
    };

    [Fact]
    public async Task Sign_up_with_confirmation_required_answers_201_with_the_verifier_only_in_an_httponly_cookie()
    {
        using var app = new AuthTestApp();
        app.Factory.Identity.NextResult = Result.Failure<AuthSession>(AuthErrors.ConfirmationRequired);

        using var response = await app.PostJsonAsync(SignUpPath, SignUpBody);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var verifier = AuthTestApp.Cookie(response, SignUpVerifier);
        Assert.NotNull(verifier);
        Assert.False(string.IsNullOrEmpty(verifier!.Value.Value));
        Assert.True(verifier.HttpOnly);
        Assert.True(verifier.Secure);
        Assert.Equal(SameSiteMode.Lax, verifier.SameSite);
        Assert.Equal("/", verifier.Path.Value);
        Assert.Equal(TimeSpan.FromHours(1), verifier.MaxAge);
        Assert.Null(AuthTestApp.Cookie(response, AccessToken));
        Assert.Null(AuthTestApp.Cookie(response, RefreshToken));

        // O verifier não vai no corpo: 201 vazio, só o cookie httpOnly (RN6 da spec 013).
        Assert.Equal(string.Empty, await response.Content.ReadAsStringAsync());

        // Para o Supabase foi o HASH do verifier, e a volta é a URL da configuração (PublicOrigin).
        var call = Assert.Single(app.Factory.Identity.Calls);
        var parts = call.Split('|');
        Assert.Equal("sign-up:Pedro", parts[0]);
        Assert.Equal("pedro@example.com", parts[1]);
        Assert.False(string.IsNullOrEmpty(parts[2]));
        Assert.NotEqual(verifier.Value.Value, parts[2]);
        Assert.Equal("http://localhost:3000/auth/confirmar-cadastro", parts[3]);
    }

    /// <summary>Dev com a flag desligada: cadastro continua criando a sessão direto, como antes.</summary>
    [Fact]
    public async Task Sign_up_with_a_direct_session_keeps_the_current_behaviour()
    {
        using var app = new AuthTestApp(); // dublê devolve a sessão por padrão

        using var response = await app.PostJsonAsync(SignUpPath, SignUpBody);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(AuthTestApp.Cookie(response, AccessToken));
        Assert.NotNull(AuthTestApp.Cookie(response, RefreshToken));
        Assert.Null(AuthTestApp.Cookie(response, SignUpVerifier));
    }

    [Fact]
    public async Task Resend_answers_202_with_a_new_verifier_cookie_and_the_configured_redirect()
    {
        using var app = new AuthTestApp();

        using var response = await app.PostJsonAsync(ResendPath, new { email = "  Pedro@Example.COM " });

        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        var verifier = AuthTestApp.Cookie(response, SignUpVerifier);
        Assert.NotNull(verifier);
        Assert.False(string.IsNullOrEmpty(verifier!.Value.Value));
        Assert.True(verifier.HttpOnly);
        Assert.Equal("/", verifier.Path.Value);
        Assert.Equal(TimeSpan.FromHours(1), verifier.MaxAge);

        var call = Assert.Single(app.Factory.Identity.Calls);
        var parts = call.Split('|');
        Assert.Equal("signup-resend:pedro@example.com", parts[0]);
        Assert.False(string.IsNullOrEmpty(parts[1]));
        Assert.NotEqual(verifier.Value.Value, parts[1]);
        Assert.Equal("http://localhost:3000/auth/confirmar-cadastro", parts[2]);
    }

    /// <summary>RN4: recusa "normal" do Supabase (não revela se o email tem cadastro) vira o mesmo 202.</summary>
    [Fact]
    public async Task Resend_stays_neutral_when_supabase_refuses_normally()
    {
        using var app = new AuthTestApp();
        app.Factory.Identity.NextUnitResult = Result.Failure<Unit>(AuthErrors.EmailNotConfirmed);

        using var response = await app.PostJsonAsync(ResendPath, new { email = "pedro@example.com" });

        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        Assert.NotNull(AuthTestApp.Cookie(response, SignUpVerifier));
    }

    [Fact]
    public async Task Resend_surfaces_rate_limit_and_outage_instead_of_lying()
    {
        using var app = new AuthTestApp();

        app.Factory.Identity.NextUnitResult = Result.Failure<Unit>(AuthErrors.RateLimited);
        using var limited = await app.PostJsonAsync(ResendPath, new { email = "pedro@example.com" });
        Assert.Equal(HttpStatusCode.TooManyRequests, limited.StatusCode);
        Assert.Equal("rate_limited", await Code(limited));
        Assert.Null(AuthTestApp.Cookie(limited, SignUpVerifier));

        app.Factory.Identity.NextUnitResult = Result.Failure<Unit>(AuthErrors.Unavailable);
        using var down = await app.PostJsonAsync(ResendPath, new { email = "pedro@example.com" });
        Assert.Equal(HttpStatusCode.ServiceUnavailable, down.StatusCode);
        Assert.Equal("auth_unavailable", await Code(down));
    }

    [Fact]
    public async Task Resend_rejects_an_invalid_email_before_talking_to_supabase()
    {
        using var app = new AuthTestApp();

        using var response = await app.PostJsonAsync(ResendPath, new { email = "nao-e-email" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("validation_failed", await Code(response));
        Assert.Empty(app.Factory.Identity.Calls);
    }

    [Fact]
    public async Task Sign_out_clears_the_signup_verifier_too()
    {
        using var app = new AuthTestApp();
        app.Factory.Identity.NextResult = Result.Failure<AuthSession>(AuthErrors.ConfirmationRequired);

        using var signUp = await app.PostJsonAsync(SignUpPath, SignUpBody);
        var signupCookie = AuthTestApp.Cookie(signUp, SignUpVerifier);
        Assert.NotNull(signupCookie);
        var verifier = signupCookie!.Value.Value!;

        // Com uma sessão aberta (velos_at), para a revogação no Supabase também acontecer.
        using var request = new HttpRequestMessage(HttpMethod.Post, SignOutPath)
        {
            Content = JsonContent.Create(new { }),
        };
        request.Headers.Add(AuthTestApp.CsrfHeader, "1");
        request.Headers.Add("Cookie", $"{AccessToken}=token-de-teste; {SignUpVerifier}={verifier}");
        using var signOut = await app.Client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NoContent, signOut.StatusCode);
        AuthTestApp.AssertExpired(AuthTestApp.Cookie(signOut, SignUpVerifier));
        Assert.Contains(app.Factory.Identity.Calls, call => call == "sign-out");
    }

    private static async Task<string?> Code(HttpResponseMessage response) =>
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString();
}
