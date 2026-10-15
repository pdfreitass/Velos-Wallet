using Velos.Application.Abstractions;
using Velos.Application.Auth;
using Velos.Application.Auth.SignIn;
using Velos.Application.Common;

namespace Velos.Application.Tests.Auth;

/// <summary>RN4, RN5, CA4, CA14 e CA15 da spec 001.</summary>
public class SignInHandlerTests
{
    private static readonly DateTimeOffset Now = new(2026, 10, 12, 12, 0, 0, TimeSpan.Zero);

    private readonly FakeIdentityProvider _identity = new();
    private readonly FakeLoginLockout _lockout = new();

    private SignInHandler Handler => new(new SignInValidator(), _lockout, _identity, new FixedTimeProvider(Now));

    [Fact]
    public async Task Correct_password_signs_in_and_clears_the_failures()
    {
        var result = await Handler.HandleAsync(new SignInCommand("  Pedro@Example.COM ", "Pedro10@"), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(["sign-in:pedro@example.com"], _identity.Calls);
        Assert.Equal(["reserve:pedro@example.com", "clear:pedro@example.com"], _lockout.Calls);
    }

    [Fact]
    public async Task Invalid_input_never_reaches_the_lockout_or_the_identity_provider()
    {
        var result = await Handler.HandleAsync(new SignInCommand("nao-e-email", ""), default);

        Assert.Equal("validation_failed", result.Error!.Code);
        var errors = Assert.IsType<Dictionary<string, string[]>>(result.Error.Details!["errors"]);
        Assert.Equal(["Informe um email válido"], errors["email"]);
        Assert.Equal(["Informe sua senha"], errors["password"]);
        Assert.Empty(_lockout.Calls);
        Assert.Empty(_identity.Calls);
    }

    [Fact]
    public async Task Lockout_unavailable_fails_closed()
    {
        _lockout.Reservation = Result.Failure<LockoutReservation>(AuthErrors.LockoutUnavailable);

        var result = await Handler.HandleAsync(new SignInCommand("pedro@example.com", "Pedro10@"), default);

        Assert.Equal("lockout_unavailable", result.Error!.Code);
        Assert.Empty(_identity.Calls);
    }

    [Fact]
    public async Task Locked_email_is_refused_even_with_the_right_password()
    {
        _lockout.Reservation = Refused(new LockoutState(5, Now.AddMinutes(7).AddSeconds(30)));

        var result = await Handler.HandleAsync(new SignInCommand("pedro@example.com", "Pedro10@"), default);

        Assert.Equal("locked", result.Error!.Code);
        Assert.Equal(8, result.Error.Details!["minutesLeft"]);
        Assert.Empty(_identity.Calls);
    }

    [Fact]
    public async Task Refusal_without_an_end_time_still_locks_for_the_full_duration()
    {
        _lockout.Reservation = Refused(new LockoutState(5, null));

        var result = await Handler.HandleAsync(new SignInCommand("pedro@example.com", "Pedro10@"), default);

        Assert.Equal("locked", result.Error!.Code);
        Assert.Equal(10, result.Error.Details!["minutesLeft"]);
        Assert.Empty(_identity.Calls);
    }

    [Theory]
    [InlineData(1, null)]
    [InlineData(2, null)]
    [InlineData(3, 2)]
    [InlineData(4, 1)]
    public async Task Wrong_password_warns_from_the_third_attempt(int failedCount, int? attemptsLeft)
    {
        _identity.NextResult = Result.Failure<AuthSession>(AuthErrors.InvalidCredentials(null));
        _lockout.Reservation = Allowed(new LockoutState(failedCount, null));

        var result = await Handler.HandleAsync(new SignInCommand("pedro@example.com", "errada"), default);

        Assert.Equal("invalid_credentials", result.Error!.Code);
        Assert.Equal(attemptsLeft, result.Error.Details?["attemptsLeft"] as int?);
        Assert.Equal(["reserve:pedro@example.com"], _lockout.Calls);
    }

    [Fact]
    public async Task Fifth_wrong_password_locks_for_ten_minutes()
    {
        _identity.NextResult = Result.Failure<AuthSession>(AuthErrors.InvalidCredentials(null));
        _lockout.Reservation = Allowed(new LockoutState(5, Now.AddMinutes(10)));

        var result = await Handler.HandleAsync(new SignInCommand("pedro@example.com", "errada"), default);

        Assert.Equal("locked", result.Error!.Code);
        Assert.Equal(10, result.Error.Details!["minutesLeft"]);
    }

    [Fact]
    public async Task Fifth_attempt_with_the_right_password_still_signs_in()
    {
        // A reserva da 5ª já liga o bloqueio, mas ESTA tentativa foi liberada: senha certa entra e zera.
        _lockout.Reservation = Allowed(new LockoutState(5, Now.AddMinutes(10)));

        var result = await Handler.HandleAsync(new SignInCommand("pedro@example.com", "Pedro10@"), default);

        Assert.True(result.IsSuccess);
        Assert.Contains("clear:pedro@example.com", _lockout.Calls);
    }

    [Fact]
    public async Task Other_identity_errors_pass_through_and_the_reserved_attempt_still_counts()
    {
        _identity.NextResult = Result.Failure<AuthSession>(AuthErrors.Unavailable);

        var result = await Handler.HandleAsync(new SignInCommand("pedro@example.com", "Pedro10@"), default);

        Assert.Equal("auth_unavailable", result.Error!.Code);
        Assert.Equal(["reserve:pedro@example.com"], _lockout.Calls);
    }

    private static Result<LockoutReservation> Allowed(LockoutState state) => Result.Success(new LockoutReservation(true, state));

    private static Result<LockoutReservation> Refused(LockoutState state) => Result.Success(new LockoutReservation(false, state));

    [Fact]
    public void Session_never_prints_its_tokens()
    {
        var text = Sessions.Valid.ToString();

        Assert.DoesNotContain("secreto", text, StringComparison.Ordinal);
        Assert.Contains("***", text, StringComparison.Ordinal);
    }
}
