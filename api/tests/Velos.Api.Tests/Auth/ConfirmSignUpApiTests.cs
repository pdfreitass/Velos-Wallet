using System.Net;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.DependencyInjection;
using Velos.Application.Auth;
using Velos.Application.Common;
using Velos.Domain.Auth;

namespace Velos.Api.Tests.Auth;

/// <summary>
/// Spec 013 (T3): a volta do link de confirmação — troca do código com o verifier do cookie
/// próprio, consumo do verifier em qualquer desfecho, os três redirects (/painel,
/// /entrar?aviso=confirmado e /entrar?erro=confirmacao, RN9) e propósitos separados do fluxo de
/// redefinição (RN6).
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

    /// <summary>
    /// Sem código não há o que trocar — e o verifier NÃO é consumido. Apagá-lo aqui deixaria
    /// qualquer página de terceiros matar um cadastro em andamento com um
    /// <c>&lt;img src="…/auth/confirmar-cadastro"&gt;</c>, já que o cookie é SameSite=Lax.
    /// </summary>
    [Fact]
    public async Task Confirm_sign_up_without_a_code_keeps_the_verifier_and_redirects_to_entrar()
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
        Assert.Null(AuthTestApp.Cookie(response, SignUpVerifier));
        Assert.Null(AuthTestApp.Cookie(response, AccessToken));
        Assert.DoesNotContain(
            app.Factory.Identity.Calls, call => call.StartsWith("exchange:", StringComparison.Ordinal));
    }

    /// <summary>
    /// RN9 não é inferência: o GoTrue recusa o token ANTES de redirecionar e volta com
    /// <c>error</c>/<c>error_code</c>. Erro declarado manda, mesmo com um <c>code</c> junto — nunca
    /// dizer "foi confirmado" para quem não confirmou.
    /// </summary>
    [Theory]
    [InlineData("?code=code-do-link&error=access_denied&error_code=otp_expired")]
    [InlineData("?error_code=otp_expired")]
    [InlineData("?code=code-do-link&error=access_denied")]
    public async Task Confirm_sign_up_with_an_error_from_gotrue_is_an_invalid_link(string query)
    {
        using var app = new AuthTestApp();

        using var response = await app.Client.GetAsync($"{ConfirmPath}{query}");

        AuthTestApp.AssertRedirect(response, "/entrar?erro=confirmacao");
        Assert.Null(AuthTestApp.Cookie(response, AccessToken));
        Assert.DoesNotContain(
            app.Factory.Identity.Calls, call => call.StartsWith("exchange:", StringComparison.Ordinal));
    }

    /// <summary>
    /// CA4 (RN9): link aberto em outro navegador — com código e sem o cookie do verifier. O email
    /// JÁ foi confirmado pelo GoTrue, então o recado é "é só entrar", não "peça outro link". Sem
    /// sessão: a troca PKCE não é possível sem o verifier, e nem é tentada.
    /// </summary>
    [Fact]
    public async Task Confirm_sign_up_in_another_browser_says_the_email_was_confirmed()
    {
        using var app = new AuthTestApp();

        using var response = await app.Client.GetAsync($"{ConfirmPath}?code=code-do-link");

        AuthTestApp.AssertRedirect(response, "/entrar?aviso=confirmado");
        Assert.Null(AuthTestApp.Cookie(response, AccessToken));
        Assert.DoesNotContain(
            app.Factory.Identity.Calls, call => call.StartsWith("exchange:", StringComparison.Ordinal));
    }

    /// <summary>
    /// CA3: sem código e sem cookie não houve confirmação nenhuma (o GoTrue recusa o token velho
    /// antes de redirecionar, e volta sem <c>code</c>) — aí o link é que não vale.
    /// </summary>
    [Fact]
    public async Task Confirm_sign_up_without_a_code_and_without_a_cookie_is_an_invalid_link()
    {
        using var app = new AuthTestApp();

        using var response = await app.Client.GetAsync(ConfirmPath);

        AuthTestApp.AssertRedirect(response, "/entrar?erro=confirmacao");
        Assert.Null(AuthTestApp.Cookie(response, AccessToken));
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

        // Para a rota do cadastro é como se não houvesse verifier: não troca nada e não dá sessão
        // (o recado é o de outro navegador, RN9 — o que importa aqui é que o verifier não serviu).
        using (var confirm = AuthTestApp.GetWithCookie($"{ConfirmPath}?code=code-do-link", ResetVerifier, resetVerifier))
        using (var response = await app.Client.SendAsync(confirm))
        {
            AuthTestApp.AssertRedirect(response, "/entrar?aviso=confirmado");
            Assert.Null(AuthTestApp.Cookie(response, AccessToken));
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
            // Não desprotege: a rota age como se o verifier não existisse (RN9) e não cria sessão.
            AuthTestApp.AssertRedirect(response, "/entrar?aviso=confirmado");
            Assert.Null(AuthTestApp.Cookie(response, AccessToken));
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
