using Velos.Domain.Accounts;

namespace Velos.Domain.Tests.Accounts;

/// <summary>RN2 e RN3 da spec 002. Os mesmos casos valem para as checks da 0009 e para o Zod do front.</summary>
public class AccountRulesTests
{
    [Theory]
    [InlineData("Nubank")]
    [InlineData("  Nubank  ")]          // as pontas não contam
    [InlineData("a")]
    public void Valid_names_are_accepted(string name) =>
        Assert.True(AccountRules.IsValidName(name));

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Empty_names_are_refused(string? name) =>
        Assert.False(AccountRules.IsValidName(name));

    [Fact]
    public void Name_limit_is_40_characters_after_trimming()
    {
        Assert.True(AccountRules.IsValidName(new string('a', 40)));
        Assert.True(AccountRules.IsValidName($"  {new string('a', 40)}  "));
        Assert.False(AccountRules.IsValidName(new string('a', 41)));
    }

    [Theory]
    [InlineData(AccountType.Checking, 123_456, true)]
    [InlineData(AccountType.Checking, 0, true)]
    [InlineData(AccountType.Checking, -35_000, true)]       // cheque especial (P1)
    [InlineData(AccountType.Savings, 0, true)]
    [InlineData(AccountType.Savings, 1, true)]
    [InlineData(AccountType.Savings, -1, false)]
    [InlineData(AccountType.Cash, 1, true)]
    [InlineData(AccountType.Cash, -1, false)]
    [InlineData(AccountType.CreditCard, -64_090, true)]     // dívida
    [InlineData(AccountType.CreditCard, 0, true)]           // cartão sem dívida
    [InlineData(AccountType.CreditCard, 1, false)]
    public void Initial_balance_sign_depends_on_the_type(AccountType type, long cents, bool expected) =>
        Assert.Equal(expected, AccountRules.IsValidInitialBalance(type, cents));

    [Theory]
    [InlineData(AccountType.Checking)]
    [InlineData(AccountType.Savings)]
    [InlineData(AccountType.Cash)]
    public void Positive_balance_limit_is_999_999_999_99(AccountType type)
    {
        Assert.True(AccountRules.IsValidInitialBalance(type, 99_999_999_999));
        Assert.False(AccountRules.IsValidInitialBalance(type, 100_000_000_000));
    }

    [Theory]
    [InlineData(AccountType.Checking)]
    [InlineData(AccountType.CreditCard)]
    public void Negative_balance_limit_is_999_999_999_99(AccountType type)
    {
        Assert.True(AccountRules.IsValidInitialBalance(type, -99_999_999_999));
        Assert.False(AccountRules.IsValidInitialBalance(type, -100_000_000_000));
    }

    [Fact]
    public void Extreme_values_do_not_overflow()
    {
        Assert.False(AccountRules.IsValidInitialBalance(AccountType.Checking, long.MinValue));
        Assert.False(AccountRules.IsValidInitialBalance(AccountType.Checking, long.MaxValue));
    }

    [Fact]
    public void Unknown_type_is_refused() =>
        Assert.False(AccountRules.IsValidInitialBalance((AccountType)99, 0));
}
