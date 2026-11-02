using Velos.Domain.Transactions;

namespace Velos.Domain.Tests.Transactions;

/// <summary>RN2, RN4, RN5 e RN8 da spec 004. Os mesmos casos valem para o Zod do front.</summary>
public class TransactionRulesTests
{
    [Theory]
    [InlineData(1)]
    [InlineData(4_590)]
    [InlineData(99_999_999_999)]        // R$ 999.999.999,99
    public void Valid_amounts_are_accepted(long cents) =>
        Assert.True(TransactionRules.IsValidAmount(cents));

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]                    // o sentido vem do tipo, nunca do sinal
    [InlineData(100_000_000_000)]
    public void Zero_negative_and_above_the_limit_are_refused(long cents) =>
        Assert.False(TransactionRules.IsValidAmount(cents));

    [Fact]
    public void Description_is_optional_and_limited_to_100_characters_after_trimming()
    {
        Assert.True(TransactionRules.IsValidDescription(null));
        Assert.True(TransactionRules.IsValidDescription(""));
        Assert.True(TransactionRules.IsValidDescription(new string('a', 100)));
        Assert.True(TransactionRules.IsValidDescription($"  {new string('a', 100)}  "));
        Assert.False(TransactionRules.IsValidDescription(new string('a', 101)));
    }

    [Theory]
    [InlineData("2026-10-18T02:59:59Z", "2026-10-17")]   // 23:59:59 em São Paulo: ainda é dia 17
    [InlineData("2026-10-18T03:00:00Z", "2026-10-18")]   // meia-noite em São Paulo
    [InlineData("2026-01-01T02:30:00Z", "2025-12-31")]   // virada do ano
    public void Today_is_the_date_in_sao_paulo_not_in_utc(string utcNow, string expected)
    {
        var time = new FixedTime(DateTimeOffset.Parse(utcNow, System.Globalization.CultureInfo.InvariantCulture));

        Assert.Equal(DateOnly.Parse(expected, System.Globalization.CultureInfo.InvariantCulture), TransactionRules.Today(time));
    }

    [Fact]
    public void Date_can_be_today_or_in_the_past_but_never_in_the_future()
    {
        var today = new DateOnly(2026, 10, 17);

        Assert.True(TransactionRules.IsValidDate(today, today));
        Assert.True(TransactionRules.IsValidDate(today.AddYears(-3), today));
        Assert.False(TransactionRules.IsValidDate(today.AddDays(1), today));
        Assert.True(TransactionRules.IsValidDate(new DateOnly(2000, 1, 1), today));
        Assert.False(TransactionRules.IsValidDate(new DateOnly(1999, 12, 31), today));   // a lista não mostraria
    }

    [Theory]
    [InlineData(TransactionType.Expense, TransactionType.Expense, true)]
    [InlineData(TransactionType.Expense, TransactionType.Income, true)]
    [InlineData(TransactionType.Income, TransactionType.Expense, true)]
    [InlineData(TransactionType.Transfer, TransactionType.Transfer, true)]
    [InlineData(TransactionType.Transfer, TransactionType.Expense, false)]
    [InlineData(TransactionType.Income, TransactionType.Transfer, false)]
    public void Type_changes_only_between_expense_and_income(TransactionType from, TransactionType to, bool allowed) =>
        Assert.Equal(allowed, TransactionRules.CanChangeType(from, to));

    private sealed class FixedTime(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }
}
