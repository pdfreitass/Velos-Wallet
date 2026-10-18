using Velos.Domain.Goals;
using Velos.Domain.Transactions;

namespace Velos.Domain.Tests.Goals;

/// <summary>RN1–RN3, RN5 e RN6 da spec 006. Os mesmos casos valem para o Zod do front.</summary>
public class GoalRulesTests
{
    private static readonly DateOnly Today = new(2026, 10, 18);

    [Fact]
    public void Name_is_required_and_limited_to_60_characters_after_trimming()
    {
        Assert.True(GoalRules.IsValidName("Viagem para o Chile"));
        Assert.True(GoalRules.IsValidName($"  {new string('a', 60)}  "));
        Assert.False(GoalRules.IsValidName(new string('a', 61)));
        Assert.False(GoalRules.IsValidName("   "));
        Assert.False(GoalRules.IsValidName(null));
    }

    [Theory]
    [InlineData(1, true)]
    [InlineData(800_000, true)]
    [InlineData(99_999_999_999, true)]
    [InlineData(0, false)]
    [InlineData(-1, false)]
    [InlineData(100_000_000_000, false)]
    public void Target_and_contribution_are_positive_and_below_the_limit(long cents, bool valid) =>
        Assert.Equal(valid, GoalRules.IsValidAmount(cents));

    [Fact]
    public void Deadline_is_optional_and_cannot_be_in_the_past_when_creating()
    {
        Assert.True(GoalRules.IsValidDeadline(null, Today));
        Assert.True(GoalRules.IsValidDeadline(Today, Today));
        Assert.True(GoalRules.IsValidDeadline(new DateOnly(2027, 6, 30), Today));
        Assert.False(GoalRules.IsValidDeadline(Today.AddDays(-1), Today));
    }

    [Fact]
    public void Editing_keeps_an_expired_deadline_but_does_not_accept_another_past_date()
    {
        var expired = new DateOnly(2026, 9, 30);

        Assert.True(GoalRules.IsValidDeadline(expired, Today, currentDeadline: expired));
        Assert.False(GoalRules.IsValidDeadline(new DateOnly(2026, 9, 29), Today, currentDeadline: expired));
        Assert.True(GoalRules.IsValidDeadline(null, Today, currentDeadline: expired));
    }

    [Fact]
    public void Contribution_date_follows_the_transaction_range()
    {
        Assert.True(GoalRules.IsValidContributionDate(Today, Today));
        Assert.False(GoalRules.IsValidContributionDate(Today.AddDays(1), Today));
        Assert.False(GoalRules.IsValidContributionDate(TransactionRules.MinDate.AddDays(-1), Today));
    }

    [Theory]
    [InlineData(0, 800_000, GoalStatus.NotStarted)]
    [InlineData(200_000, 800_000, GoalStatus.InProgress)]
    [InlineData(800_000, 800_000, GoalStatus.Reached)]
    [InlineData(900_000, 800_000, GoalStatus.Reached)]
    public void Status_comes_from_the_amount_saved(long current, long target, GoalStatus expected) =>
        Assert.Equal(expected, GoalRules.Status(current, target));

    [Fact]
    public void Ca2_pace_is_rounded_up_counting_the_current_month()
    {
        // R$ 6.000,00 de outubro/2026 a junho/2027 = 9 meses → R$ 666,666… → R$ 666,67.
        Assert.Equal(66_667, GoalRules.MonthlyPace(600_000, new DateOnly(2027, 6, 1), Today));
    }

    [Fact]
    public void Deadline_in_the_current_month_asks_for_everything_now()
    {
        Assert.Equal(12_345, GoalRules.MonthlyPace(12_345, new DateOnly(2026, 10, 31), Today));
        Assert.Equal(12_345, GoalRules.MonthlyPace(12_345, Today, Today));
    }

    [Fact]
    public void Exact_division_is_not_rounded()
    {
        Assert.Equal(100_000, GoalRules.MonthlyPace(300_000, new DateOnly(2026, 12, 1), Today));
    }

    [Fact]
    public void No_pace_without_deadline_when_reached_or_after_the_deadline()
    {
        Assert.Null(GoalRules.MonthlyPace(600_000, null, Today));
        Assert.Null(GoalRules.MonthlyPace(0, new DateOnly(2027, 6, 1), Today));
        Assert.Null(GoalRules.MonthlyPace(600_000, Today.AddDays(-1), Today));
    }

    [Fact]
    public void Deadline_passes_only_the_day_after()
    {
        Assert.False(GoalRules.IsDeadlinePassed(null, Today));
        Assert.False(GoalRules.IsDeadlinePassed(Today, Today));
        Assert.True(GoalRules.IsDeadlinePassed(Today.AddDays(-1), Today));
    }

    [Theory]
    [InlineData("2026-11-01T02:59:59Z", 3)]   // 23:59:59 de 31/10 em São Paulo: outubro ainda conta (out, nov, dez)
    [InlineData("2026-11-01T03:00:00Z", 2)]   // meia-noite em São Paulo: já é novembro (nov, dez)
    public void Month_turns_at_midnight_in_sao_paulo(string utcNow, int months)
    {
        var time = new FixedTime(DateTimeOffset.Parse(utcNow, System.Globalization.CultureInfo.InvariantCulture));
        var today = TransactionRules.Today(time);

        Assert.Equal(300_000 / months, GoalRules.MonthlyPace(300_000, new DateOnly(2026, 12, 31), today));
    }

    private sealed class FixedTime(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }
}
