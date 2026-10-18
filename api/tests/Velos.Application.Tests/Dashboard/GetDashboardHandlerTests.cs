using Velos.Application.Abstractions;
using Velos.Application.Common;
using Velos.Application.Dashboard;

namespace Velos.Application.Tests.Dashboard;

/// <summary>Início (spec 005): mês padrão em São Paulo, mês inválido e repasse dos números do store.</summary>
public class GetDashboardHandlerTests
{
    private readonly FakeDashboardStore _store = new();

    private GetDashboardHandler Handler(DateTimeOffset now) => new(new FakeUserContext(), _store, new FixedTimeProvider(now));

    [Fact]
    public async Task Without_month_uses_the_current_month_in_sao_paulo_and_passes_the_numbers_through()
    {
        _store.Balances = new BalanceTotals(2, 1, 1_250_000, 64_090);
        _store.Month = new MonthResult(300_000, 25_580, 274_420);
        _store.Spending = [new CategorySpending(null, null, null, null, 12_000)];

        // 01/11 às 02:00 UTC = 31/10 às 23:00 em São Paulo.
        var result = await Handler(new DateTimeOffset(2026, 11, 1, 2, 0, 0, TimeSpan.Zero)).HandleAsync(null, default);

        Assert.Equal(
            new DashboardSummary("2026-10", 2, 1, 1_250_000, 64_090, 300_000, 25_580, 274_420, _store.Spending),
            result.Value);
        Assert.Equal(["balances", "month:2026-10-01", "spending:2026-10-01"], _store.Calls);
        Assert.All(_store.UserIds, id => Assert.Equal(FakeUserContext.DefaultUserId, id));
    }

    [Theory]
    [InlineData("2026-13")]
    [InlineData("10-2026")]
    [InlineData("2101-01")]
    public async Task Invalid_month_is_refused_without_touching_the_database(string month)
    {
        var result = await Handler(DateTimeOffset.UtcNow).HandleAsync(month, default);

        Assert.Equal("validation_failed", result.Error!.Code);
        Assert.Empty(_store.Calls);
    }

    [Fact]
    public async Task Database_failure_is_passed_through()
    {
        _store.Failure = CommonErrors.DatabaseUnavailable;

        var result = await Handler(DateTimeOffset.UtcNow).HandleAsync("2026-10", default);

        Assert.Equal(CommonErrors.DatabaseUnavailable, result.Error);
    }

    private sealed class FakeDashboardStore : IDashboardStore
    {
        public BalanceTotals Balances { get; set; } = new(0, 0, 0, 0);

        public MonthResult Month { get; set; } = new(0, 0, 0);

        public IReadOnlyList<CategorySpending> Spending { get; set; } = [];

        public AppError? Failure { get; set; }

        public List<string> Calls { get; } = [];

        public List<Guid> UserIds { get; } = [];

        public Task<Result<BalanceTotals>> GetBalancesAsync(Guid userId, CancellationToken cancellationToken) =>
            Task.FromResult(Track(userId, "balances", Balances));

        public Task<Result<MonthResult>> GetMonthResultAsync(Guid userId, DateOnly monthStart, CancellationToken cancellationToken) =>
            Task.FromResult(Track(userId, $"month:{monthStart:yyyy-MM-dd}", Month));

        public Task<Result<IReadOnlyList<CategorySpending>>> GetCategorySpendingAsync(
            Guid userId, DateOnly monthStart, CancellationToken cancellationToken) =>
            Task.FromResult(Track(userId, $"spending:{monthStart:yyyy-MM-dd}", Spending));

        private Result<T> Track<T>(Guid userId, string call, T value)
        {
            UserIds.Add(userId);
            Calls.Add(call);
            return Failure is null ? Result.Success(value) : Result.Failure<T>(Failure);
        }
    }
}
