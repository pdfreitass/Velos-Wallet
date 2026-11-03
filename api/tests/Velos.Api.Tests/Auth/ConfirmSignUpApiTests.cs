using System.Net;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.DependencyInjection;
using Velos.Application.Auth;
using Velos.Application.Common;
using Velos.Domain.Auth;

namespace Velos.Api.Tests.Auth;

/// <summary>
/// Spec 013 (T3): a volta do link de confirmação — troca do código com o verifier do cookie
/// próprio, consumo do verifier em qualquer desfecho, redirects /painel e /entrar?erro=confirmacao,
/// e propósitos separados do fluxo de redefinição (RN6).
/// </summary>
public class ConfirmSignUpApiTests
{
    private const string SignUpVerifier = "velos_signup";
    private const string ResetVerifier = "velos_pkce";
    private const string AccessToken = "velos_at";
    private const string RefreshToken = "velos_rt";

    private const string SignUpPath = "/api/auth/sign-up";
    private const string ConfirmPath = "/auth/confirmar-cadastro";
    private const string ResetConfirmPath = "/auth/confirm";
    private const string ResetRequestPath = "/api/auth/password-reset";

    private static object SignUpBody => new
    {
        name = "Pedro",
        email = "pedro@example.com",
        password = "Pedro10@",
        confirmPassword = "Pedro10@",
    };

    [Fact]
    public async Task Confirm_sign_up_exchanges_the_code_with_the_cookie_verifier_and_redirects_to_painel()
    {
        using var app = new AuthTestApp();
        app.Factory.Identity.NextResult = Result.Failure<AuthSession>(AuthErrors.ConfirmationRequired);

        using var signUp = await app.PostJsonAsync(SignUpPath, SignUpBody);
        var signupCookie = AuthTestApp.Cookie(signUp, SignUpVerifier);
        Assert.NotNull(signupCookie);
        var verifier = signupCookie!.Value.Value!;

        // A troca do código devolve a sessão (o cadastro, com a flag ligada, devolveu só o verifier).
        app.Factory.Identity.NextResult = Result.Success(FakeIdentityProvider.Session);

        using var confirm = AuthTestApp.GetWithCookie($"{ConfirmPath}?code=code-do-link", SignUpVerifier, verifier);
        using var response = await app.Client.SendAsync(confirm);

        AuthTestApp.AssertRedirect(response, "/painel");
        Assert.NotNull(AuthTestApp.Cookie(response, AccessToken));
        Assert.NotNull(AuthTestApp.Cookie(response, RefreshToken));
        AuthTestApp.AssertExpired(AuthTestApp.Cookie(response, SignUpVerifier));

        // O código foi trocado com o verifier do cookie, não com um valor vindo de outro lugar.
        var exchange = Assert.Single(
            app.Factory.Identity.Calls, call => call.StartsWith("exchange:", StringComparison.Ordinal));
        var parts = exchange.Split('|');
        Assert.Equal("exchange:code-do-link", parts[0]);
        Assert.False(string.IsNullOrEmpty(parts[1]));
    }

    [Fact]
    public async Task Confirm_sign_up_without_a_code_consumes_the_verifier_and_redirects_to_entrar()
    {
        using var app = new AuthTestApp();
        app.Factory.Identity.NextResult = Result.Failure<AuthSession>(AuthErrors.ConfirmationRequired);

        using var signUp = await app.PostJsonAsync(SignUpPath, SignUpBody);
        var signupCookie = AuthTestApp.Cookie(signUp, SignUpVerifier);
        Assert.NotNull(signupCookie);
        var verifier = signupCookie!.Value.Value!;

        using var confirm = AuthTestApp.GetWithCookie(ConfirmPath, SignUpVerifier, verifier);
        using var response = await app.Client.SendAsync(confirm);

        AuthTestApp.AssertRedirect(response, "/entrar?erro=confirmacao");
        AuthTestApp.AssertExpired(AuthTestApp.Cookie(response, SignUpVerifier));
        Assert.Null(AuthTestApp.Cookie(response, AccessToken));
        Assert.DoesNotContain(
            app.Factory.Identity.Calls, call => call.StartsWith("exchange:", StringComparison.Ordinal));
    }

    /// <summary>CA4: link aberto em outro navegador, sem o cookie do verifier, é o mesmo link inválido.</summary>
    [Fact]
    public async Task Confirm_sign_up_without_the_verifier_cookie_is_the_same_invalid_link()
    {
        using var app = new AuthTestApp();

        using var response = await app.Client.GetAsync($"{ConfirmPath}?code=code-do-link");

        AuthTestApp.AssertRedirect(response, "/entrar?erro=confirmacao");
        Assert.DoesNotContain(
            app.Factory.Identity.Calls, call => call.StartsWith("exchange:", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Confirm_sign_up_redirects_to_entrar_when_supabase_refuses_the_code()
    {
        using var app = new AuthTestApp();
        app.Factory.Identity.NextResult = Result.Failure<AuthSession>(AuthErrors.ConfirmationRequired);

        using var signUp = await app.PostJsonAsync(SignUpPath, SignUpBody);
        var signupCookie = AuthTestApp.Cookie(signUp, SignUpVerifier);
        Assert.NotNull(signupCookie);
        var verifier = signupCookie!.Value.Value!;

        app.Factory.Identity.NextResult = Result.Failure<AuthSession>(AuthErrors.InvalidCredentials(null));
        using var confirm = AuthTestApp.GetWithCookie($"{ConfirmPath}?code=code-velho", SignUpVerifier, verifier);
        using var response = await app.Client.SendAsync(confirm);

        AuthTestApp.AssertRedirect(response, "/entrar?erro=confirmacao");
        AuthTestApp.AssertExpired(AuthTestApp.Cookie(response, SignUpVerifier));
        Assert.Null(AuthTestApp.Cookie(response, AccessToken));
    }

    /// <summary>RN6: cookies e propósitos separados — o verifier de um fluxo não vale no outro.</summary>
    [Fact]
    public async Task Signup_verifier_does_not_work_in_the_reset_flow_and_vice_versa()
    {
        using var app = new AuthTestApp();

        // Verifier do CADASTRO não vale na rota da REDEFINIÇÃO.
        app.Factory.Identity.NextResult = Result.Failure<AuthSession>(AuthErrors.ConfirmationRequired);
        using var signUp = await app.PostJsonAsync(SignUpPath, SignUpBody);
        var signupVerifierCookie = AuthTestApp.Cookie(signUp, SignUpVerifier);
        Assert.NotNull(signupVerifierCookie);
        var signupVerifier = signupVerifierCookie!.Value.Value!;

        using (var confirm = AuthTestApp.GetWithCookie($"{ResetConfirmPath}?code=code-do-link", SignUpVerifier, signupVerifier))
        using (var response = await app.Client.SendAsync(confirm))
        {
            AuthTestApp.AssertRedirect(response, "/recuperar-senha?erro=link");
            Assert.DoesNotContain(
                app.Factory.Identity.Calls, call => call.StartsWith("exchange:", StringComparison.Ordinal));
        }

        // Verifier da REDEFINIÇÃO não vale na rota do CADASTRO.
        using var reset = await app.PostJsonAsync(ResetRequestPath, new { email = "pedro@example.com" });
        Assert.Equal(HttpStatusCode.Accepted, reset.StatusCode);
        var resetVerifierCookie = AuthTestApp.Cookie(reset, ResetVerifier);
        Assert.NotNull(resetVerifierCookie);
        var resetVerifier = resetVerifierCookie!.Value.Value!;

        using (var confirm = AuthTestApp.GetWithCookie($"{ConfirmPath}?code=code-do-link", ResetVerifier, resetVerifier))
        using (var response = await app.Client.SendAsync(confirm))
        {
            AuthTestApp.AssertRedirect(response, "/entrar?erro=confirmacao");
            Assert.DoesNotContain(
                app.Factory.Identity.Calls, call => call.StartsWith("exchange:", StringComparison.Ordinal));
        }
    }

    /// <summary>
    /// RN6 além do nome do cookie: um payload protegido com o propósito de OUTRO fluxo não
    /// desprotege, mesmo dentro do cookie de nome certo.
    /// </summary>
    [Fact]
    public async Task Verifier_protected_with_the_wrong_purpose_is_treated_as_absent()
    {
        using var app = new AuthTestApp();
        var protection = app.Factory.Services.GetRequiredService<IDataProtectionProvider>();

        // Cookie do cadastro com payload protegido com o propósito da REDEFINIÇÃO.
        var forgedSignup = protection.CreateProtector("Velos.PasswordReset.Pkce")
            .ToTimeLimitedDataProtector().Protect("verifier-de-outro-fluxo", TimeSpan.FromHours(1));
        using (var confirm = AuthTestApp.GetWithCookie($"{ConfirmPath}?code=code-do-link", SignUpVerifier, forgedSignup))
        using (var response = await app.Client.SendAsync(confirm))
        {
            AuthTestApp.AssertRedirect(response, "/entrar?erro=confirmacao");
        }

        // E o contrário: propósito do CADASTRO no cookie da REDEFINIÇÃO.
        var forgedReset = protection.CreateProtector("Velos.Signup.Pkce")
            .ToTimeLimitedDataProtector().Protect("verifier-de-outro-fluxo", TimeSpan.FromHours(1));
        using (var confirm = AuthTestApp.GetWithCookie($"{ResetConfirmPath}?code=code-do-link", ResetVerifier, forgedReset))
        using (var response = await app.Client.SendAsync(confirm))
        {
            AuthTestApp.AssertRedirect(response, "/recuperar-senha?erro=link");
        }

        Assert.DoesNotContain(
            app.Factory.Identity.Calls, call => call.StartsWith("exchange:", StringComparison.Ordinal));
    }
}
