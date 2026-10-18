using Velos.Application.Accounts;
using Velos.Application.Categories;
using Velos.Application.Dashboard;
using Velos.Application.Transactions;
using Velos.Domain.Accounts;
using Velos.Domain.Categories;
using Velos.Domain.Transactions;

namespace Velos.Infrastructure.IntegrationTests;

/// <summary>
/// <see cref="Persistence.DashboardStore"/> contra o banco real (spec 005). Precisa da migration 0012
/// (view category_spending). Usa fev/2001 para não misturar com dados de verdade; compara os saldos
/// pela diferença antes/depois, porque a conta de teste pode ter outras contas.
/// </summary>
public class DashboardStoreTests
{
    private static readonly DateOnly Month = new(2001, 2, 1);

    [DatabaseFact(RequiresTestUser = true)]
    public async Task Totals_leave_the_card_out_and_ignore_transfers()
    {
        await using var me = StoreTestContext.Me();
        var before = (await me.Dashboard.GetBalancesAsync(me.UserId, default)).Value;
        var nubank = await NewAccountAsync(me, AccountType.Checking, 250_000);
        var reserva = await NewAccountAsync(me, AccountType.Savings, 1_000_000);
        var card = await NewAccountAsync(me, AccountType.CreditCard, -64_090);
        var food = (await me.Categories.CreateAsync(
            me.UserId, new NewCategory(StoreTestContext.UniqueName("Comida"), CategoryType.Expense, "#E5484D", "utensils"), default)).Value;
        try
        {
            await CreateAsync(me, new TransactionData(TransactionType.Expense, 10_000, Month, null, nubank, null, food));
            await CreateAsync(me, new TransactionData(TransactionType.Expense, 2_500, Month, null, card, null, null));
            await CreateAsync(me, new TransactionData(TransactionType.Income, 300_000, Month, null, nubank, null, null));
            await CreateAsync(me, new TransactionData(TransactionType.Transfer, 50_000, Month, null, nubank, reserva, null));

            var after = (await me.Dashboard.GetBalancesAsync(me.UserId, default)).Value;
            Assert.Equal(2, after.AccountCount - before.AccountCount);
            Assert.Equal(1, after.CreditCardCount - before.CreditCardCount);
            // CA1: saldo sem o cartão (a transferência só move entre contas somadas).
            Assert.Equal(250_000 + 1_000_000 - 10_000 + 300_000, after.TotalBalanceCents - before.TotalBalanceCents);
            Assert.Equal(64_090 + 2_500, after.CreditCardDebtCents - before.CreditCardDebtCents);

            // CA3: transferência fora; resultado calculado no SQL.
            Assert.Equal(new MonthResult(300_000, 12_500, 287_500), (await me.Dashboard.GetMonthResultAsync(me.UserId, Month, default)).Value);

            // CA4: maior primeiro, "Sem categoria" com id nulo.
            var spending = (await me.Dashboard.GetCategorySpendingAsync(me.UserId, Month, default)).Value;
            Assert.Equal([(food as Guid?, 10_000L), (null, 2_500L)], spending.Select(s => (s.CategoryId, s.AmountCents)));
        }
        finally
        {
            foreach (var id in new[] { nubank, reserva, card })
            {
                await me.Accounts.DeleteAsync(me.UserId, id, default);
            }

            await me.Categories.DeleteAsync(me.UserId, food, default);
        }
    }

    [DatabaseFact(RequiresTestUser = true)]
    public async Task Another_user_sees_nothing()
    {
        await using var stranger = StoreTestContext.Stranger();

        Assert.Equal(new BalanceTotals(0, 0, 0, 0), (await stranger.Dashboard.GetBalancesAsync(stranger.UserId, default)).Value);
        Assert.Empty((await stranger.Dashboard.GetCategorySpendingAsync(stranger.UserId, Month, default)).Value);
    }

    private static async Task<Guid> NewAccountAsync(StoreTestContext context, AccountType type, long cents) =>
        (await context.Accounts.CreateAsync(context.UserId, new NewAccount(StoreTestContext.UniqueName("Teste"), type, cents), default)).Value;

    private static async Task CreateAsync(StoreTestContext context, TransactionData data)
    {
        var result = await context.Transactions.CreateAsync(context.UserId, data, default);
        Assert.True(result.IsSuccess, result.Error?.Code);
    }
}
