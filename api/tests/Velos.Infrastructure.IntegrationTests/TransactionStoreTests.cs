using Velos.Application.Accounts;
using Velos.Application.Categories;
using Velos.Application.Transactions;
using Velos.Domain.Accounts;
using Velos.Domain.Categories;
using Velos.Domain.Transactions;

namespace Velos.Infrastructure.IntegrationTests;

/// <summary>
/// <see cref="Persistence.TransactionStore"/> contra o banco real (spec 004, T4). Usa um mês antigo
/// (jan/2001) para não misturar com dados de verdade, e apaga as contas no <c>finally</c> (as
/// transações vão junto, em cascata).
/// </summary>
public class TransactionStoreTests
{
    private static readonly DateOnly Month = new(2001, 1, 1);

    [DatabaseFact(RequiresTestUser = true)]
    public async Task Balances_totals_and_list_follow_the_transactions()
    {
        await using var me = StoreTestContext.Me();
        var nubank = await NewAccountAsync(me, AccountType.Checking, 100_000);
        var reserva = await NewAccountAsync(me, AccountType.Savings, 0);
        var card = await NewAccountAsync(me, AccountType.CreditCard, -64_090);
        var food = (await me.Categories.CreateAsync(
            me.UserId, new NewCategory(StoreTestContext.UniqueName("Comida"), CategoryType.Expense, "#E5484D", "utensils"), default)).Value;
        try
        {
            var expense = await CreateAsync(me, new TransactionData(
                TransactionType.Expense, 4_590, Month.AddDays(9), "Mercado", nubank, null, food));
            // "Sem categoria" (RN6: categoria excluída) é aceito pelo banco.
            await CreateAsync(me, new TransactionData(TransactionType.Income, 300_000, Month.AddDays(4), null, nubank, null, null));
            await CreateAsync(me, new TransactionData(TransactionType.Transfer, 50_000, Month.AddDays(10), null, nubank, reserva, null));
            await CreateAsync(me, new TransactionData(TransactionType.Transfer, 20_000, Month.AddDays(11), null, nubank, card, null));

            // CA2, CA4, CA5: saldos pela view.
            Assert.Equal(100_000 + 300_000 - 4_590 - 50_000 - 20_000, await BalanceAsync(me, nubank));
            Assert.Equal(50_000, await BalanceAsync(me, reserva));
            Assert.Equal(-64_090 + 20_000, await BalanceAsync(me, card));

            // CA7: transferência fora dos totais; lista do mais novo para o mais antigo, com nomes.
            Assert.Equal(new MonthTotals(300_000, 4_590), (await me.Transactions.GetMonthTotalsAsync(me.UserId, Month, default)).Value);
            var items = (await me.Transactions.ListMonthAsync(me.UserId, Month, null, default)).Value;
            Assert.Equal([Month.AddDays(11), Month.AddDays(10), Month.AddDays(9), Month.AddDays(4)], items.Select(i => i.Date));
            Assert.Null(items[3].Category);
            Assert.Equal("Mercado", items[2].Description);
            Assert.Equal(food, items[2].Category!.Id);
            Assert.Equal(reserva, items[1].TransferAccount!.Id);

            // CA8: filtro por categoria.
            Assert.Equal([expense], (await me.Transactions.ListMonthAsync(me.UserId, Month, food, default)).Value.Select(i => i.Id));

            // CA9 e CA10: editar e excluir mudam o saldo.
            Assert.True((await me.Transactions.UpdateAsync(me.UserId, expense, new TransactionData(
                TransactionType.Expense, 10_000, Month.AddDays(9), null, nubank, null, food), default)).Value);
            Assert.Equal(400_000 - 10_000 - 70_000, await BalanceAsync(me, nubank));
            Assert.True((await me.Transactions.DeleteAsync(me.UserId, expense, default)).Value);
            Assert.Equal(400_000 - 70_000, await BalanceAsync(me, nubank));
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
    public async Task Transfer_to_the_same_account_is_refused_by_the_database_shape_check()
    {
        // A Application já recusa; aqui só confirma que o banco responde sem o texto do Postgres.
        await using var me = StoreTestContext.Me();
        var nubank = await NewAccountAsync(me, AccountType.Checking, 0);
        try
        {
            var result = await me.Transactions.CreateAsync(me.UserId, new TransactionData(
                TransactionType.Transfer, 100, Month, null, nubank, nubank, null), default);

            Assert.Equal("validation_failed", result.Error!.Code);
        }
        finally
        {
            await me.Accounts.DeleteAsync(me.UserId, nubank, default);
        }
    }

    /// <summary>CA11 / CA-seg: nem o filtro da API nem a RLS deixam outra pessoa ver ou mexer.</summary>
    [DatabaseFact(RequiresTestUser = true)]
    public async Task Another_user_cannot_read_change_delete_or_reference()
    {
        await using var me = StoreTestContext.Me();
        await using var stranger = StoreTestContext.Stranger();
        var nubank = await NewAccountAsync(me, AccountType.Checking, 0);
        try
        {
            var id = await CreateAsync(me, new TransactionData(TransactionType.Transfer, 100, Month, null, nubank,
                await NewAccountAsync(me, AccountType.Cash, 0), null));
            var data = new TransactionData(TransactionType.Expense, 1, Month, null, nubank, null, null);

            Assert.Null((await stranger.Transactions.GetAsync(stranger.UserId, id, default)).Value);
            Assert.Empty((await stranger.Transactions.ListMonthAsync(stranger.UserId, Month, null, default)).Value);
            Assert.False((await stranger.Transactions.UpdateAsync(stranger.UserId, id, data, default)).Value);
            Assert.False((await stranger.Transactions.DeleteAsync(stranger.UserId, id, default)).Value);
            Assert.False((await stranger.Transactions.GetReferencesAsync(stranger.UserId, nubank, null, null, default)).Value.AccountFound);

            // Só a RLS: sessão do outro usuário com o MEU id no filtro.
            Assert.Null((await stranger.Transactions.GetAsync(me.UserId, id, default)).Value);
            Assert.False((await stranger.Transactions.DeleteAsync(me.UserId, id, default)).Value);

            Assert.NotNull((await me.Transactions.GetAsync(me.UserId, id, default)).Value);
        }
        finally
        {
            foreach (var account in (await me.Accounts.ListAsync(me.UserId, default)).Value.Where(a => a.Name.StartsWith("Teste ", StringComparison.Ordinal)))
            {
                await me.Accounts.DeleteAsync(me.UserId, account.Id, default);
            }
        }
    }

    private static async Task<Guid> NewAccountAsync(StoreTestContext context, AccountType type, long cents) =>
        (await context.Accounts.CreateAsync(context.UserId, new NewAccount(StoreTestContext.UniqueName("Teste"), type, cents), default)).Value;

    private static async Task<Guid> CreateAsync(StoreTestContext context, TransactionData data)
    {
        var result = await context.Transactions.CreateAsync(context.UserId, data, default);
        Assert.True(result.IsSuccess, result.Error?.Code);
        return result.Value;
    }

    private static async Task<long> BalanceAsync(StoreTestContext context, Guid accountId) =>
        (await context.Accounts.GetAsync(context.UserId, accountId, default)).Value!.BalanceCents;
}
