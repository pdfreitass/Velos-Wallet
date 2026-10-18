using Velos.Application.Transactions;
using Velos.Domain.Transactions;

namespace Velos.Application.Tests.Transactions;

/// <summary>Lista do mês, abrir e excluir: CA7, CA8, CA10 e CA11 da spec 004.</summary>
public class ReadAndDeleteTransactionHandlerTests
{
    private static readonly Guid OtherUser = Guid.Parse("99999999-9999-9999-9999-999999999999");

    private readonly FakeUserContext _user = new();
    private readonly FakeTransactionStore _store = new();

    private ListTransactionsHandler List(DateTimeOffset now) => new(_user, _store, new FixedTimeProvider(now));

    [Fact]
    public async Task Without_month_the_current_month_in_sao_paulo_is_used()
    {
        // 01/11 às 02:00 UTC = 31/10 às 23:00 em São Paulo: ainda é outubro.
        var result = await List(new DateTimeOffset(2026, 11, 1, 2, 0, 0, TimeSpan.Zero)).HandleAsync(null, null, default);

        Assert.Equal("2026-10", result.Value.Month);
        Assert.Contains("list:2026-10-01|", _store.Calls);
    }

    [Fact]
    public async Task Month_and_filter_are_passed_and_totals_come_from_the_store()
    {
        var food = Guid.NewGuid();
        _store.Totals = new MonthTotals(300_000, 4_590);

        var result = await List(DateTimeOffset.UtcNow).HandleAsync("2026-09", food, default);

        Assert.Equal(new TransactionMonth("2026-09", 300_000, 4_590, []), result.Value with { Items = [] });
        Assert.Contains($"list:2026-09-01|{food}", _store.Calls);
        Assert.Contains("totals:2026-09-01", _store.Calls);
    }

    [Theory]
    [InlineData("2026-13")]
    [InlineData("2026-1")]
    [InlineData("outubro")]
    [InlineData("1999-12")]
    public async Task Invalid_month_is_refused(string month)
    {
        var result = await List(DateTimeOffset.UtcNow).HandleAsync(month, null, default);

        Assert.Equal("validation_failed", result.Error!.Code);
        Assert.Empty(_store.Calls);
    }

    [Fact]
    public async Task Get_of_someone_elses_transaction_is_not_found()
    {
        var theirs = _store.Add(OtherUser, new TransactionDetail(
            Guid.NewGuid(), TransactionType.Expense, 100, new DateOnly(2026, 10, 1), null, Guid.NewGuid(), null, null));

        var result = await new GetTransactionHandler(_user, _store).HandleAsync(theirs.Id, default);

        Assert.Equal(TransactionErrors.NotFound, result.Error);
    }

    [Fact]
    public async Task Delete_removes_mine_and_refuses_someone_elses()
    {
        var mine = _store.Add(FakeUserContext.DefaultUserId, new TransactionDetail(
            Guid.NewGuid(), TransactionType.Expense, 100, new DateOnly(2026, 10, 1), null, Guid.NewGuid(), null, null));
        var theirs = _store.Add(OtherUser, mine with { Id = Guid.NewGuid() });
        var handler = new DeleteTransactionHandler(_user, _store);

        Assert.True((await handler.HandleAsync(mine.Id, default)).IsSuccess);
        Assert.Null(_store.Find(mine.Id));

        Assert.Equal(TransactionErrors.NotFound, (await handler.HandleAsync(theirs.Id, default)).Error);
        Assert.NotNull(_store.Find(theirs.Id));
    }
}
