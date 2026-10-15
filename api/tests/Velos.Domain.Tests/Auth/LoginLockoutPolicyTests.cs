using Velos.Domain.Auth;

namespace Velos.Domain.Tests.Auth;

public class LoginLockoutPolicyTests
{
    [Theory]
    [InlineData(0, null)]
    [InlineData(1, null)]
    [InlineData(2, null)]
    [InlineData(3, 2)]   // RN5: a partir da 3ª falha avisa quantas restam
    [InlineData(4, 1)]
    [InlineData(5, null)] // na 5ª já é bloqueio, não aviso
    public void Warning_starts_at_the_third_failure(int failedCount, int? expected)
    {
        Assert.Equal(expected, LoginLockoutPolicy.AttemptsLeftToWarn(failedCount));
    }

    [Theory]
    [InlineData(600, 10)]
    [InlineData(541, 10)]  // 9 min 1 s → "10 minutos"
    [InlineData(540, 9)]
    [InlineData(30, 1)]
    [InlineData(0, 1)]     // nunca "0 minutos"
    [InlineData(605, 10)]  // relógio do banco à frente do da API: nunca "11 minutos"
    public void Minutes_left_round_up_and_never_reach_zero(int secondsLeft, int expected)
    {
        var now = new DateTimeOffset(2026, 10, 12, 12, 0, 0, TimeSpan.Zero);

        Assert.Equal(expected, LoginLockoutPolicy.MinutesLeft(now.AddSeconds(secondsLeft), now));
    }
}
