using Velos.Application.Common;
using Velos.Application.Transactions;
using Velos.Domain.Categories;
using Velos.Domain.Transactions;

namespace Velos.Application.Tests.Transactions;

/// <summary>Criar e editar transação: RN1–RN5, RN8, RN10, CA6, CA9, CA11 e CA12 da spec 004.</summary>
public class SaveTransactionHandlerTests
{
    private static readonly Guid Me = FakeUserContext.DefaultUserId;
    private static readonly Guid OtherUser = Guid.Parse("99999999-9999-9999-9999-999999999999");

    // 17/10/2026 às 23:30 em São Paulo (02:30 UTC do dia 18): "hoje" ainda é dia 17.
    private static readonly DateTimeOffset Now = new(2026, 10, 18, 2, 30, 0, TimeSpan.Zero);
    private static readonly DateOnly Today = new(2026, 10, 17);

    private readonly FakeUserContext _user = new();
    private readonly FakeTransactionStore _store = new();
    private readonly Guid _nubank;
    private readonly Guid _reserva;
    private readonly Guid _food;
    private readonly Guid _salary;

    public SaveTransactionHandlerTests()
    {
        _nubank = _store.AddAccount(Me);
        _reserva = _store.AddAccount(Me);
        _food = _store.AddCategory(Me, CategoryType.Expense);
        _salary = _store.AddCategory(Me, CategoryType.Income);
    }

    private CreateTransactionHandler Create => new(Validator, _user, _store);

    private UpdateTransactionHandler Update => new(Validator, _user, _store);

    private static TransactionInputValidator Validator => new(new FixedTimeProvider(Now));

    [Fact]
    public async Task Expense_is_saved_with_the_user_from_the_jwt_and_a_trimmed_description()
    {
        var result = await Create.HandleAsync(Expense(4_590) with { Description = "  Mercado do bairro " }, default);

        Assert.True(result.IsSuccess);
        Assert.Equal(new TransactionData(TransactionType.Expense, 4_590, Today, "Mercado do bairro", _nubank, null, _food), _store.LastSaved);
        Assert.All(_store.UserIds, id => Assert.Equal(Me, id));
    }

    [Fact]
    public async Task Blank_description_is_saved_as_null()
    {
        await Create.HandleAsync(Expense(100) with { Description = "   " }, default);

        Assert.Null(_store.LastSaved!.Description);
    }

    [Fact]
    public async Task Transfer_drops_the_category_and_expense_drops_the_target_account()
    {
        await Create.HandleAsync(Transfer(50_000) with { CategoryId = _food }, default);
        Assert.Null(_store.LastSaved!.CategoryId);
        Assert.Equal(_reserva, _store.LastSaved.TransferAccountId);

        await Create.HandleAsync(Expense(100) with { TransferAccountId = _reserva }, default);
        Assert.Null(_store.LastSaved!.TransferAccountId);
    }

    [Theory]
    [InlineData(0, "Informe um valor maior que zero")]
    [InlineData(-4_590, "Informe um valor maior que zero")]
    [InlineData(100_000_000_000, "O valor máximo é R$ 999.999.999,99")]
    public async Task Wrong_amount_is_refused_with_the_field_message(long cents, string message)
    {
        var result = await Create.HandleAsync(Expense(cents), default);

        Assert.Equal([message], Errors(result)["amountCents"]);
        Assert.DoesNotContain(_store.Calls, call => call.StartsWith("create", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Tomorrow_in_sao_paulo_is_refused_but_today_is_accepted()
    {
        var tomorrow = await Create.HandleAsync(Expense(100) with { Date = Today.AddDays(1) }, default);
        Assert.Equal(["A data não pode ser no futuro"], Errors(tomorrow)["date"]);

        var today = await Create.HandleAsync(Expense(100) with { Date = Today }, default);
        Assert.True(today.IsSuccess);
    }

    [Fact]
    public async Task Date_before_2000_is_refused()
    {
        var result = await Create.HandleAsync(Expense(100) with { Date = new DateOnly(1, 1, 1) }, default);

        Assert.Equal(["Informe uma data a partir de 2000"], Errors(result)["date"]);
    }

    [Fact]
    public async Task Missing_fields_are_refused_with_their_messages()
    {
        var result = await Create.HandleAsync(new SaveTransactionCommand(TransactionType.Expense, 100, null, null, null, null, null), default);

        var errors = Errors(result);
        Assert.Equal(["Informe a data"], errors["date"]);
        Assert.Equal(["Escolha a conta"], errors["accountId"]);
        Assert.Equal(["Escolha uma categoria de despesa"], errors["categoryId"]);
    }

    [Theory]
    [InlineData(null)]
    [InlineData((TransactionType)99)]
    public async Task Missing_or_unknown_type_is_refused(TransactionType? type)
    {
        var result = await Create.HandleAsync(Expense(100) with { Type = type }, default);

        Assert.Equal(["Escolha o tipo da transação"], Errors(result)["type"]);
    }

    [Fact]
    public async Task Description_above_100_characters_is_refused()
    {
        var result = await Create.HandleAsync(Expense(100) with { Description = new string('a', 101) }, default);

        Assert.Equal(["A descrição pode ter no máximo 100 caracteres"], Errors(result)["description"]);
    }

    [Fact]
    public async Task Transfer_to_the_same_account_or_without_target_is_refused()
    {
        var same = await Create.HandleAsync(Transfer(100) with { TransferAccountId = _nubank }, default);
        Assert.Equal(["Escolha uma conta diferente da de origem"], Errors(same)["transferAccountId"]);

        var missing = await Create.HandleAsync(Transfer(100) with { TransferAccountId = null }, default);
        Assert.Equal(["Escolha a conta de destino"], Errors(missing)["transferAccountId"]);
    }

    [Fact]
    public async Task Expense_with_an_income_category_is_refused()
    {
        var result = await Create.HandleAsync(Expense(100) with { CategoryId = _salary }, default);

        Assert.Equal(["Escolha uma categoria de despesa"], Errors(result)["categoryId"]);
    }

    [Fact]
    public async Task Income_with_an_expense_category_is_refused()
    {
        var result = await Create.HandleAsync(Expense(100) with { Type = TransactionType.Income, CategoryId = _food }, default);

        Assert.Equal(["Escolha uma categoria de receita"], Errors(result)["categoryId"]);
    }

    [Fact]
    public async Task Someone_elses_account_category_or_target_is_refused_as_not_found()
    {
        var theirAccount = _store.AddAccount(OtherUser);
        var theirCategory = _store.AddCategory(OtherUser, CategoryType.Expense);

        var account = await Create.HandleAsync(Expense(100) with { AccountId = theirAccount }, default);
        Assert.Equal(["Conta não encontrada"], Errors(account)["accountId"]);

        var category = await Create.HandleAsync(Expense(100) with { CategoryId = theirCategory }, default);
        Assert.Equal(["Escolha uma categoria de despesa"], Errors(category)["categoryId"]);

        var target = await Create.HandleAsync(Transfer(100) with { TransferAccountId = theirAccount }, default);
        Assert.Equal(["Conta não encontrada"], Errors(target)["transferAccountId"]);

        Assert.DoesNotContain(_store.Calls, call => call.StartsWith("create", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Update_changes_the_amount_and_can_swap_expense_for_income()
    {
        var saved = _store.Add(Me, Detail(TransactionType.Expense, _food));

        var result = await Update.HandleAsync(
            saved.Id, Expense(9_990) with { Type = TransactionType.Income, CategoryId = _salary }, default);

        Assert.True(result.IsSuccess);
        Assert.Equal(TransactionType.Income, _store.Find(saved.Id)!.Type);
        Assert.Equal(9_990, _store.Find(saved.Id)!.AmountCents);
    }

    [Theory]
    [InlineData(TransactionType.Transfer, TransactionType.Expense)]
    [InlineData(TransactionType.Expense, TransactionType.Transfer)]
    public async Task Update_refuses_turning_a_transfer_into_expense_or_back(TransactionType from, TransactionType to)
    {
        var saved = _store.Add(Me, Detail(from, from == TransactionType.Transfer ? null : _food));
        var command = to == TransactionType.Transfer ? Transfer(100) : Expense(100);

        var result = await Update.HandleAsync(saved.Id, command, default);

        Assert.Equal(["O tipo só pode trocar entre despesa e receita"], Errors(result)["type"]);
        Assert.Equal(from, _store.Find(saved.Id)!.Type);
    }

    [Fact]
    public async Task Update_gives_a_category_to_an_uncategorized_transaction()
    {
        // CA12: a categoria foi excluída e a transação ficou "Sem categoria".
        var saved = _store.Add(Me, Detail(TransactionType.Expense, null));

        var result = await Update.HandleAsync(saved.Id, Expense(100), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(_food, _store.Find(saved.Id)!.CategoryId);
    }

    [Fact]
    public async Task Update_of_someone_elses_transaction_is_not_found_and_changes_nothing()
    {
        var theirs = _store.Add(OtherUser, Detail(TransactionType.Expense, _food));

        var result = await Update.HandleAsync(theirs.Id, Expense(1), default);

        Assert.Equal(TransactionErrors.NotFound, result.Error);
        Assert.Equal(theirs, _store.Find(theirs.Id));
    }

    [Fact]
    public async Task Database_failure_is_passed_through()
    {
        _store.Failure = CommonErrors.DatabaseUnavailable;

        var result = await Create.HandleAsync(Expense(100), default);

        Assert.Equal(CommonErrors.DatabaseUnavailable, result.Error);
    }

    private SaveTransactionCommand Expense(long cents) =>
        new(TransactionType.Expense, cents, Today, null, _nubank, null, _food);

    private SaveTransactionCommand Transfer(long cents) =>
        new(TransactionType.Transfer, cents, Today, null, _nubank, _reserva, null);

    private TransactionDetail Detail(TransactionType type, Guid? categoryId) => new(
        Guid.NewGuid(), type, 4_590, Today, null, _nubank,
        type == TransactionType.Transfer ? _reserva : null, categoryId);

    private static Dictionary<string, string[]> Errors<T>(Result<T> result)
    {
        Assert.Equal("validation_failed", result.Error!.Code);
        return Assert.IsType<Dictionary<string, string[]>>(result.Error.Details!["errors"]);
    }
}
