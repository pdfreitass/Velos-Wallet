using Velos.Application.Accounts;
using Velos.Application.Common;
using Velos.Domain.Accounts;

namespace Velos.Application.Tests.Accounts;

/// <summary>Criar e editar conta: RN1–RN3, CA1, CA1b, CA2, CA4, CA5 e CA11 da spec 002.</summary>
public class SaveAccountHandlerTests
{
    private static readonly Guid OtherUser = Guid.Parse("99999999-9999-9999-9999-999999999999");

    private readonly FakeUserContext _user = new();
    private readonly FakeAccountStore _store = new();

    private CreateAccountHandler Create => new(new AccountInputValidator(), _user, _store);

    private UpdateAccountHandler Update => new(new AccountInputValidator(), _user, _store);

    [Fact]
    public async Task Create_trims_the_name_and_uses_the_user_from_the_jwt()
    {
        var result = await Create.HandleAsync(new CreateAccountCommand("  Nubank ", AccountType.Checking, 123_456), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(["create:Nubank|Checking|123456"], _store.Calls);
        Assert.Equal([FakeUserContext.DefaultUserId], _store.UserIds);
    }

    [Theory]
    [InlineData(AccountType.Checking, -35_000)]      // CA1b: cheque especial
    [InlineData(AccountType.CreditCard, -64_090)]    // CA2: dívida
    [InlineData(AccountType.CreditCard, 0)]
    [InlineData(AccountType.Savings, 0)]
    public async Task Allowed_signs_are_saved_as_sent(AccountType type, long cents)
    {
        var result = await Create.HandleAsync(new CreateAccountCommand("Conta", type, cents), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(cents, _store.Find(result.Value)!.InitialBalanceCents);
    }

    [Theory]
    [InlineData(AccountType.Savings, -1, "O saldo inicial não pode ser negativo")]
    [InlineData(AccountType.Cash, -1, "O saldo inicial não pode ser negativo")]
    [InlineData(AccountType.CreditCard, 1, "No cartão, informe quanto você deve (o valor vira dívida)")]
    [InlineData(AccountType.Checking, 100_000_000_000, "O valor máximo é R$ 999.999.999,99")]
    [InlineData(AccountType.CreditCard, -100_000_000_000, "O valor máximo é R$ 999.999.999,99")]
    public async Task Wrong_balance_is_refused_with_the_field_message(AccountType type, long cents, string message)
    {
        var result = await Create.HandleAsync(new CreateAccountCommand("Conta", type, cents), default);

        Assert.Equal([message], Errors(result)["initialBalanceCents"]);
        Assert.Empty(_store.Calls);
    }

    [Theory]
    [InlineData("", "Informe o nome da conta")]
    [InlineData("   ", "Informe o nome da conta")]
    [InlineData("12345678901234567890123456789012345678901", "O nome pode ter no máximo 40 caracteres")]
    public async Task Wrong_name_is_refused_with_the_field_message(string name, string message)
    {
        var result = await Create.HandleAsync(new CreateAccountCommand(name, AccountType.Cash, 0), default);

        Assert.Equal([message], Errors(result)["name"]);
    }

    [Theory]
    [InlineData(null)]
    [InlineData((AccountType)99)]
    public async Task Missing_or_unknown_type_is_refused(AccountType? type)
    {
        var result = await Create.HandleAsync(new CreateAccountCommand("Conta", type, 0), default);

        Assert.Equal(["Escolha o tipo da conta"], Errors(result)["type"]);
        Assert.Empty(_store.Calls);
    }

    [Fact]
    public async Task Update_changes_name_and_balance_and_keeps_the_type()
    {
        var account = _store.Add(FakeUserContext.DefaultUserId, Account(AccountType.CreditCard, -10_000));

        var result = await Update.HandleAsync(new UpdateAccountCommand(account.Id, " Cartão Inter ", -20_000), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(account with { Name = "Cartão Inter", InitialBalanceCents = -20_000 }, _store.Find(account.Id));
    }

    [Fact]
    public async Task Update_validates_the_balance_against_the_saved_type()
    {
        var card = _store.Add(FakeUserContext.DefaultUserId, Account(AccountType.CreditCard, 0));

        var result = await Update.HandleAsync(new UpdateAccountCommand(card.Id, "Cartão", 5_000), default);

        Assert.Equal(["No cartão, informe quanto você deve (o valor vira dívida)"], Errors(result)["initialBalanceCents"]);
        Assert.DoesNotContain(_store.Calls, call => call.StartsWith("update:", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Update_of_someone_elses_account_is_not_found_and_changes_nothing()
    {
        var theirs = _store.Add(OtherUser, Account(AccountType.Cash, 1_000));

        var result = await Update.HandleAsync(new UpdateAccountCommand(theirs.Id, "Minha agora", 0), default);

        Assert.Equal(AccountErrors.NotFound, result.Error);
        Assert.Equal(theirs, _store.Find(theirs.Id));
        Assert.All(_store.UserIds, id => Assert.Equal(FakeUserContext.DefaultUserId, id));
    }

    [Fact]
    public async Task Database_failure_is_passed_through()
    {
        _store.Failure = CommonErrors.DatabaseUnavailable;

        var result = await Create.HandleAsync(new CreateAccountCommand("Conta", AccountType.Cash, 0), default);

        Assert.Equal(CommonErrors.DatabaseUnavailable, result.Error);
    }

    internal static AccountSummary Account(AccountType type, long cents, string name = "Conta") =>
        new(Guid.NewGuid(), name, type, cents, cents);

    private static Dictionary<string, string[]> Errors<T>(Result<T> result)
    {
        Assert.Equal("validation_failed", result.Error!.Code);
        return Assert.IsType<Dictionary<string, string[]>>(result.Error.Details!["errors"]);
    }
}
