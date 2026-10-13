using Velos.Application.Auth;
using Velos.Application.Auth.Google;
using Velos.Application.Common;
using Velos.Domain.Auth;

namespace Velos.Application.Tests.Auth;

/// <summary>Login com Google (H4, CA6) da spec 001.</summary>
public class StartGoogleSignInHandlerTests
{
    private const string Callback = "http://localhost:3000/auth/callback?next=%2Fpainel";

    private readonly FakeIdentityProvider _identity = new();

    [Fact]
    public void Sends_the_challenge_and_keeps_the_verifier()
    {
        var started = new StartGoogleSignInHandler(_identity).Handle(Callback);

        var call = Assert.Single(_identity.Calls);
        var parts = call.Split('|');
        Assert.Equal($"authorize:{PkcePair.ChallengeFor(started.CodeVerifier)}", parts[0]);
        Assert.Equal(Callback, parts[1]);

        // O verifier fica com o navegador; só o hash vai para o Supabase.
        Assert.DoesNotContain(started.CodeVerifier, started.AuthorizeUrl.AbsoluteUri, StringComparison.Ordinal);
    }

    [Fact]
    public void Each_attempt_gets_a_new_verifier()
    {
        var handler = new StartGoogleSignInHandler(_identity);

        Assert.NotEqual(handler.Handle(Callback).CodeVerifier, handler.Handle(Callback).CodeVerifier);
    }
}

public class CompleteGoogleSignInHandlerTests
{
    private readonly FakeIdentityProvider _identity = new();

    private CompleteGoogleSignInHandler Handler => new(_identity);

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
    public async Task Without_both_halves_it_never_calls_the_identity_provider(string? code, string? verifier)
    {
        var result = await Handler.HandleAsync(code, verifier, default);

        Assert.Equal("google_failed", result.Error!.Code);
        Assert.Empty(_identity.Calls);
    }

    [Fact]
    public async Task Any_refusal_becomes_the_same_google_error()
    {
        _identity.NextResult = Result.Failure<AuthSession>(AuthErrors.SessionExpired);

        var result = await Handler.HandleAsync("codigo", "verifier", default);

        Assert.Equal("google_failed", result.Error!.Code);
    }

    /// <summary>Supabase fora do ar mantém o próprio erro: usar email e senha não resolveria.</summary>
    [Fact]
    public async Task Outage_keeps_its_own_error()
    {
        _identity.NextResult = Result.Failure<AuthSession>(AuthErrors.Unavailable);

        var result = await Handler.HandleAsync("codigo", "verifier", default);

        Assert.Equal("auth_unavailable", result.Error!.Code);
    }
}
