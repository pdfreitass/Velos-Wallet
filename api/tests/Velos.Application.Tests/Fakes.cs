using Velos.Application.Abstractions;
using Velos.Application.Auth;
using Velos.Application.Common;

namespace Velos.Application.Tests;

internal sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
{
    public override DateTimeOffset GetUtcNow() => now;
}

internal sealed class FakeIdentityProvider : IIdentityProvider
{
    public Result<AuthSession> NextResult { get; set; } = Result.Success(Sessions.Valid);

    public List<string> Calls { get; } = [];

    public Task<Result<AuthSession>> SignInWithPasswordAsync(string email, string password, CancellationToken cancellationToken)
    {
        Calls.Add($"sign-in:{email}");
        return Task.FromResult(NextResult);
    }

    public Task<Result<AuthSession>> SignUpAsync(string name, string email, string password, CancellationToken cancellationToken)
    {
        Calls.Add($"sign-up:{name}|{email}");
        return Task.FromResult(NextResult);
    }

    public Task<Result<AuthSession>> RefreshAsync(string refreshToken, CancellationToken cancellationToken) =>
        Task.FromResult(NextResult);

    public Task SignOutAsync(string accessToken, CancellationToken cancellationToken)
    {
        Calls.Add("sign-out");
        return Task.CompletedTask;
    }

    /// <summary>Resultado dos métodos que só dizem sim ou não (envio do email, troca de senha).</summary>
    public Result<Unit> NextUnitResult { get; set; } = Result.Ok();

    public Task<Result<Unit>> SendPasswordResetAsync(
        string email, string codeChallenge, string redirectTo, CancellationToken cancellationToken)
    {
        Calls.Add($"recover:{email}|{codeChallenge}|{redirectTo}");
        return Task.FromResult(NextUnitResult);
    }

    public Task<Result<AuthSession>> ExchangeCodeAsync(string code, string codeVerifier, CancellationToken cancellationToken)
    {
        Calls.Add($"exchange:{code}|{codeVerifier}");
        return Task.FromResult(NextResult);
    }

    public Task<Result<Unit>> UpdatePasswordAsync(string accessToken, string newPassword, CancellationToken cancellationToken)
    {
        // A senha NÃO entra no registro: nem num dublê de teste ela deve ficar guardada.
        Calls.Add("update-password");
        return Task.FromResult(NextUnitResult);
    }

    public Uri BuildGoogleAuthorizeUrl(string codeChallenge, string redirectTo)
    {
        Calls.Add($"authorize:{codeChallenge}|{redirectTo}");
        return new Uri(
            $"https://projeto.supabase.co/auth/v1/authorize?provider=google"
            + $"&redirect_to={Uri.EscapeDataString(redirectTo)}&code_challenge={codeChallenge}");
    }
}

internal sealed class FakeLoginLockout : ILoginLockout
{
    /// <summary>Padrão: tentativa liberada, primeira falha da sequência.</summary>
    public Result<LockoutReservation> Reservation { get; set; } =
        Result.Success(new LockoutReservation(true, new LockoutState(1, null)));

    public List<string> Calls { get; } = [];

    public Task<Result<LockoutReservation>> ReserveAttemptAsync(string email, CancellationToken cancellationToken)
    {
        Calls.Add($"reserve:{email}");
        return Task.FromResult(Reservation);
    }

    public Task<Result<Unit>> ClearAsync(UserIdentity user, CancellationToken cancellationToken)
    {
        Calls.Add($"clear:{user.Email}");
        return Task.FromResult(Result.Ok());
    }
}

internal static class Sessions
{
    public static readonly AuthSession Valid = new(
        "access-token-secreto", "refresh-token-secreto", 3600,
        new UserIdentity(Guid.Parse("11111111-1111-1111-1111-111111111111"), "pedro@example.com"));
}
