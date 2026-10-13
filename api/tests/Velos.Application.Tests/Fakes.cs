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
}

internal sealed class FakeLoginLockout : ILoginLockout
{
    public Result<LockoutState> State { get; set; } = Result.Success(new LockoutState(0, null));

    public Result<LockoutState> AfterFailure { get; set; } = Result.Success(new LockoutState(1, null));

    public List<string> Calls { get; } = [];

    public Task<Result<LockoutState>> GetStateAsync(string email, CancellationToken cancellationToken)
    {
        Calls.Add($"state:{email}");
        return Task.FromResult(State);
    }

    public Task<Result<LockoutState>> RegisterFailureAsync(string email, CancellationToken cancellationToken)
    {
        Calls.Add($"failure:{email}");
        return Task.FromResult(AfterFailure);
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
