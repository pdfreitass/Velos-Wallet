using Velos.Application.Auth;
using Velos.Application.Auth.SignUp;
using Velos.Application.Common;
using Velos.Domain.Auth;

namespace Velos.Application.Tests.Auth;

/// <summary>Spec 013: confirmação de cadastro (troca do link) e reenvio neutro (RN4).</summary>
public class SignUpConfirmationHandlerTests
{
    private const string RedirectTo = "http://localhost:3000/auth/confirmar-cadastro";

    private readonly FakeIdentityProvider _identity = new();

    [Fact]
    public async Task Confirm_without_a_code_is_an_invalid_link()
    {
        var handler = new ConfirmSignUpHandler(_identity);

        var result = await handler.HandleAsync(null, "verifier", default);

        Assert.Equal("signup_link_invalid", result.Error!.Code);
        Assert.Empty(_identity.Calls);
    }

    [Fact]
    public async Task Confirm_without_a_verifier_is_an_invalid_link()
    {
        var handler = new ConfirmSignUpHandler(_identity);

        var result = await handler.HandleAsync("code", null, default);

        Assert.Equal("signup_link_invalid", result.Error!.Code);
        Assert.Empty(_identity.Calls);
    }

    [Fact]
    public async Task Any_supabase_refusal_becomes_an_invalid_link()
    {
        var handler = new ConfirmSignUpHandler(_identity);
        _identity.NextResult = Result.Failure<AuthSession>(AuthErrors.InvalidCredentials(null));

        var result = await handler.HandleAsync("code", "verifier", default);

        Assert.Equal("signup_link_invalid", result.Error!.Code);
    }

    [Fact]
    public async Task Outage_stays_an_outage_instead_of_lying_about_the_link()
    {
        var handler = new ConfirmSignUpHandler(_identity);
        _identity.NextResult = Result.Failure<AuthSession>(AuthErrors.Unavailable);

        var result = await handler.HandleAsync("code", "verifier", default);

        Assert.Equal("auth_unavailable", result.Error!.Code);
    }

    [Fact]
    public async Task Valid_exchange_returns_the_session()
    {
        var handler = new ConfirmSignUpHandler(_identity);

        var result = await handler.HandleAsync("code", "verifier", default);

        Assert.True(result.IsSuccess);
        Assert.Equal(Sessions.Valid, result.Value);
    }

    [Fact]
    public async Task Resend_normalizes_the_email_and_sends_the_challenge_not_the_verifier()
    {
        var handler = new RequestSignUpConfirmationHandler(new RequestSignUpConfirmationValidator(), _identity);

        var result = await handler.HandleAsync(
            new RequestSignUpConfirmationCommand("  Pedro@Example.COM "), RedirectTo, default);

        Assert.True(result.IsSuccess);
        var call = Assert.Single(_identity.Calls);
        var parts = call.Split('|');
        Assert.Equal("signup-resend:pedro@example.com", parts[0]);
        Assert.Equal(PkcePair.ChallengeFor(result.Value.CodeVerifier), parts[1]);
        Assert.DoesNotContain(result.Value.CodeVerifier, parts[1], StringComparison.Ordinal);
        Assert.Equal(RedirectTo, parts[2]);
    }

    /// <summary>RN4: recusa "normal" do Supabase (não revela conta) vira o mesmo sucesso neutro.</summary>
    [Fact]
    public async Task Resend_is_neutral_even_when_supabase_refuses_normally()
    {
        var handler = new RequestSignUpConfirmationHandler(new RequestSignUpConfirmationValidator(), _identity);
        _identity.NextUnitResult = Result.Failure<Unit>(AuthErrors.EmailNotConfirmed);

        var result = await handler.HandleAsync(
            new RequestSignUpConfirmationCommand("pedro@example.com"), RedirectTo, default);

        Assert.True(result.IsSuccess);
        Assert.False(string.IsNullOrWhiteSpace(result.Value.CodeVerifier));
    }

    /// <summary>
    /// RN4: o limite de envios do Supabase é POR USUÁRIO (`SMTP_MAX_FREQUENCY`), então devolvê-lo
    /// revelaria que o email tem cadastro — email sem conta não tem frequência para estourar.
    /// Fica neutro; quem freia abuso é a política por IP da API.
    /// </summary>
    [Fact]
    public async Task Resend_stays_neutral_when_supabase_reports_its_per_user_email_rate_limit()
    {
        var handler = new RequestSignUpConfirmationHandler(new RequestSignUpConfirmationValidator(), _identity);
        _identity.NextUnitResult = Result.Failure<Unit>(AuthErrors.RateLimited);

        var limited = await handler.HandleAsync(
            new RequestSignUpConfirmationCommand("pedro@example.com"), RedirectTo, default);

        Assert.True(limited.IsSuccess);
        Assert.False(string.IsNullOrWhiteSpace(limited.Value.CodeVerifier));
    }

    /// <summary>Serviço fora do ar é a única exceção à neutralidade: dizer "enviamos" seria mentir.</summary>
    [Fact]
    public async Task Resend_surfaces_an_outage_instead_of_lying()
    {
        var handler = new RequestSignUpConfirmationHandler(new RequestSignUpConfirmationValidator(), _identity);
        _identity.NextUnitResult = Result.Failure<Unit>(AuthErrors.Unavailable);

        var down = await handler.HandleAsync(
            new RequestSignUpConfirmationCommand("pedro@example.com"), RedirectTo, default);

        Assert.Equal("auth_unavailable", down.Error!.Code);
    }

    [Fact]
    public async Task Resend_never_reaches_the_identity_provider_for_an_invalid_email()
    {
        var handler = new RequestSignUpConfirmationHandler(new RequestSignUpConfirmationValidator(), _identity);

        var result = await handler.HandleAsync(
            new RequestSignUpConfirmationCommand("nao-e-email"), RedirectTo, default);

        Assert.Equal("validation_failed", result.Error!.Code);
        Assert.Empty(_identity.Calls);
    }
}
