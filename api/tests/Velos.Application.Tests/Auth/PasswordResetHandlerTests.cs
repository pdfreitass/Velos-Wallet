using Velos.Application.Auth;
using Velos.Application.Auth.PasswordReset;
using Velos.Application.Common;
using Velos.Domain.Auth;

namespace Velos.Application.Tests.Auth;

/// <summary>Recuperação de senha (H5, RN6, CA7) da spec 001.</summary>
public class RequestPasswordResetHandlerTests
{
    private const string RedirectTo = "http://localhost:3000/auth/confirm";

    private readonly FakeIdentityProvider _identity = new();

    private RequestPasswordResetHandler Handler => new(new RequestPasswordResetValidator(), _identity);

    [Fact]
    public async Task Normalizes_the_email_and_sends_the_challenge_not_the_verifier()
    {
        var result = await Handler.HandleAsync(new RequestPasswordResetCommand("  Pedro@Example.COM "), RedirectTo, default);

        Assert.True(result.IsSuccess);
        var call = Assert.Single(_identity.Calls);
        var parts = call.Split('|');
        Assert.Equal("recover:pedro@example.com", parts[0]);
        Assert.Equal(RedirectTo, parts[2]);

        // O que foi para o Supabase é o HASH do verifier, nunca o verifier.
        Assert.Equal(PkcePair.ChallengeFor(result.Value.CodeVerifier), parts[1]);
        Assert.DoesNotContain(result.Value.CodeVerifier, parts[1], StringComparison.Ordinal);
    }

    [Fact]
    public async Task Each_request_gets_a_new_verifier()
    {
        var first = await Handler.HandleAsync(new RequestPasswordResetCommand("pedro@example.com"), RedirectTo, default);
        var second = await Handler.HandleAsync(new RequestPasswordResetCommand("pedro@example.com"), RedirectTo, default);

        Assert.NotEqual(first.Value.CodeVerifier, second.Value.CodeVerifier);
    }

    [Fact]
    public async Task Invalid_email_never_reaches_the_identity_provider()
    {
        var result = await Handler.HandleAsync(new RequestPasswordResetCommand("nao-e-email"), RedirectTo, default);

        Assert.Equal("validation_failed", result.Error!.Code);
        Assert.Empty(_identity.Calls);
    }

    /// <summary>RN4: o handler não distingue email com conta de email sem conta — o Supabase também não.</summary>
    [Fact]
    public async Task Rate_limit_and_outage_do_surface_because_neither_reveals_an_account()
    {
        _identity.NextUnitResult = Result.Failure<Unit>(AuthErrors.RateLimited);
        var limited = await Handler.HandleAsync(new RequestPasswordResetCommand("pedro@example.com"), RedirectTo, default);
        Assert.Equal("rate_limited", limited.Error!.Code);

        _identity.NextUnitResult = Result.Failure<Unit>(AuthErrors.Unavailable);
        var down = await Handler.HandleAsync(new RequestPasswordResetCommand("pedro@example.com"), RedirectTo, default);
        Assert.Equal("auth_unavailable", down.Error!.Code);
    }
}

public class ConfirmPasswordResetHandlerTests
{
    private readonly FakeIdentityProvider _identity = new();

    private ConfirmPasswordResetHandler Handler => new(_identity);

    [Fact]
    public async Task Exchanges_the_code_with_the_verifier()
    {
        var result = await Handler.HandleAsync("codigo", "verifier", default);

        Assert.True(result.IsSuccess);
        Assert.Equal(["exchange:codigo|verifier"], _identity.Calls);
    }

    [Theory]
    [InlineData(null, "verifier")]
    [InlineData("codigo", null)]
    [InlineData("", "")]
    [InlineData("   ", "verifier")]
    public async Task Without_both_halves_it_never_calls_the_identity_provider(string? code, string? verifier)
    {
        var result = await Handler.HandleAsync(code, verifier, default);

        Assert.Equal("reset_link_invalid", result.Error!.Code);
        Assert.Empty(_identity.Calls);
    }

    /// <summary>CA7: código expirado, já usado ou de outro navegador dão a MESMA resposta.</summary>
    [Fact]
    public async Task Any_refusal_becomes_the_same_invalid_link()
    {
        _identity.NextResult = Result.Failure<AuthSession>(AuthErrors.SessionExpired);

        var result = await Handler.HandleAsync("codigo-ja-usado", "verifier", default);

        Assert.Equal("reset_link_invalid", result.Error!.Code);
    }

    /// <summary>Supabase fora do ar não é "link inválido": pedir outro email não resolveria.</summary>
    [Fact]
    public async Task Outage_keeps_its_own_error()
    {
        _identity.NextResult = Result.Failure<AuthSession>(AuthErrors.Unavailable);

        var result = await Handler.HandleAsync("codigo", "verifier", default);

        Assert.Equal("auth_unavailable", result.Error!.Code);
    }
}

public class ChangePasswordHandlerTests
{
    private static readonly UserIdentity User = Sessions.Valid.User;

    private readonly FakeIdentityProvider _identity = new();
    private readonly FakeLoginLockout _lockout = new();

    private ChangePasswordHandler Handler => new(new ChangePasswordValidator(), _identity, _lockout);

    [Fact]
    public async Task Changing_the_password_releases_the_lockout()
    {
        var result = await Handler.HandleAsync(
            new ChangePasswordCommand("Pedro10@", "Pedro10@"), "access-token", User, default);

        Assert.True(result.IsSuccess);
        Assert.Equal(["update-password"], _identity.Calls);
        Assert.Equal(["clear:pedro@example.com"], _lockout.Calls);
    }

    [Fact]
    public async Task Weak_password_is_refused_before_reaching_the_identity_provider()
    {
        var result = await Handler.HandleAsync(
            new ChangePasswordCommand("fraca", "fraca"), "access-token", User, default);

        Assert.Equal("validation_failed", result.Error!.Code);
        Assert.Empty(_identity.Calls);
        Assert.Empty(_lockout.Calls);
    }

    /// <summary>RN2, igual ao cadastro: o erro sai no segundo campo.</summary>
    [Fact]
    public async Task Mismatched_confirmation_is_refused()
    {
        var result = await Handler.HandleAsync(
            new ChangePasswordCommand("Pedro10@", "Pedro11@"), "access-token", User, default);

        var errors = Assert.IsType<Dictionary<string, string[]>>(result.Error!.Details!["errors"]);
        Assert.Equal(["As senhas não coincidem"], errors["confirmPassword"]);
        Assert.Empty(_identity.Calls);
    }

    [Fact]
    public async Task A_refused_update_never_touches_the_lockout()
    {
        _identity.NextUnitResult = Result.Failure<Unit>(AuthErrors.SessionExpired);

        var result = await Handler.HandleAsync(
            new ChangePasswordCommand("Pedro10@", "Pedro10@"), "access-token", User, default);

        Assert.Equal("session_expired", result.Error!.Code);
        Assert.Empty(_lockout.Calls);
    }
}
