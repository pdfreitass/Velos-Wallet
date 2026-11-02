using Velos.Application.Accounts;
using Velos.Domain.Accounts;

namespace Velos.Infrastructure.IntegrationTests;

/// <summary>
/// <see cref="Persistence.AccountStore"/> contra o banco real (spec 002, T6). Grava de verdade e
/// apaga no <c>finally</c> tudo o que criou (excluir a conta leva as movimentações junto).
/// </summary>
public class AccountStoreTests
{
    [DatabaseFact(RequiresTestUser = true)]
    public async Task Create_read_update_and_delete()
    {
        await using var me = StoreTestContext.Me();
        var name = StoreTestContext.UniqueName("Corrente");
        var id = (await me.Accounts.CreateAsync(me.UserId, new NewAccount(name, AccountType.Checking, -35_000), default)).Value;
        try
        {
            Assert.Equal(new AccountSummary(id, name, AccountType.Checking, -35_000, -35_000),
                (await me.Accounts.GetAsync(me.UserId, id, default)).Value);
            Assert.Contains((await me.Accounts.ListAsync(me.UserId, default)).Value, account => account.Id == id);

            Assert.True((await me.Accounts.UpdateAsync(me.UserId, id, new AccountChanges("Renomeada", 10), default)).Value);
            Assert.Equal(new AccountSummary(id, "Renomeada", AccountType.Checking, 10, 10),
                (await me.Accounts.GetAsync(me.UserId, id, default)).Value);

            Assert.True((await me.Accounts.DeleteAsync(me.UserId, id, default)).Value);
            Assert.Null((await me.Accounts.GetAsync(me.UserId, id, default)).Value);
        }
        finally
        {
            await me.Accounts.DeleteAsync(me.UserId, id, default);
        }
    }

    [DatabaseFact(RequiresTestUser = true)]
    public async Task Rule_broken_in_the_database_comes_back_as_validation_without_postgres_text()
    {
        await using var me = StoreTestContext.Me();

        var result = await me.Accounts.CreateAsync(me.UserId, new NewAccount("Poupança", AccountType.Savings, -1), default);

        Assert.Equal("validation_failed", result.Error!.Code);
        Assert.DoesNotContain("accounts_", result.Error.Message, StringComparison.Ordinal);
    }

    /// <summary>CA-seg: nem o filtro da API nem a RLS deixam outra pessoa ver ou mexer na conta.</summary>
    [DatabaseFact(RequiresTestUser = true)]
    public async Task Another_user_cannot_read_change_or_delete()
    {
        await using var me = StoreTestContext.Me();
        await using var stranger = StoreTestContext.Stranger();
        var id = (await me.Accounts.CreateAsync(me.UserId, new NewAccount("Minha", AccountType.Cash, 1_000), default)).Value;
        try
        {
            // Sessão e filtro do outro usuário.
            Assert.Null((await stranger.Accounts.GetAsync(stranger.UserId, id, default)).Value);
            Assert.DoesNotContain((await stranger.Accounts.ListAsync(stranger.UserId, default)).Value, a => a.Id == id);
            Assert.False((await stranger.Accounts.UpdateAsync(stranger.UserId, id, new AccountChanges("Roubada", 0), default)).Value);
            Assert.Null((await stranger.Accounts.GetDeletionImpactAsync(stranger.UserId, id, default)).Value);
            Assert.False((await stranger.Accounts.DeleteAsync(stranger.UserId, id, default)).Value);

            // Só a RLS: sessão do outro usuário com o MEU id no filtro.
            Assert.Null((await stranger.Accounts.GetAsync(me.UserId, id, default)).Value);
            Assert.False((await stranger.Accounts.DeleteAsync(me.UserId, id, default)).Value);

            Assert.Equal(new AccountSummary(id, "Minha", AccountType.Cash, 1_000, 1_000),
                (await me.Accounts.GetAsync(me.UserId, id, default)).Value);
        }
        finally
        {
            await me.Accounts.DeleteAsync(me.UserId, id, default);
        }
    }

    /// <summary>RN6 / CA6b: conta os dois lados das transferências e cita as outras contas.</summary>
    [DatabaseFact(RequiresTestUser = true)]
    public async Task Deletion_impact_counts_both_sides_and_delete_cascades()
    {
        await using var me = StoreTestContext.Me();
        var main = (await me.Accounts.CreateAsync(me.UserId, new NewAccount("Principal", AccountType.Checking, 0), default)).Value;
        var savings = (await me.Accounts.CreateAsync(me.UserId, new NewAccount("Bpoupança", AccountType.Savings, 0), default)).Value;
        var wallet = (await me.Accounts.CreateAsync(me.UserId, new NewAccount("Adinheiro", AccountType.Cash, 5_000), default)).Value;
        try
        {
            await me.AddTransactionAsync("income", main, 10_000);
            await me.AddTransactionAsync("expense", main, 1_000);
            await me.AddTransactionAsync("expense", main, 2_000);
            await me.AddTransactionAsync("transfer", main, 3_000, transferAccountId: savings);   // saída
            await me.AddTransactionAsync("transfer", wallet, 500, transferAccountId: main);      // entrada

            var impact = (await me.Accounts.GetDeletionImpactAsync(me.UserId, main, default)).Value!;

            Assert.Equal((1, 2, 2), (impact.IncomeCount, impact.ExpenseCount, impact.TransferCount));
            Assert.Equal(["Adinheiro", "Bpoupança"], impact.AffectedAccounts.Select(a => a.Name));
            Assert.Equal(3_000, (await me.Accounts.GetAsync(me.UserId, savings, default)).Value!.BalanceCents);

            Assert.True((await me.Accounts.DeleteAsync(me.UserId, main, default)).Value);

            // As transferências somem dos dois lados: os saldos das outras voltam ao inicial.
            Assert.Equal(0, (await me.Accounts.GetAsync(me.UserId, savings, default)).Value!.BalanceCents);
            Assert.Equal(5_000, (await me.Accounts.GetAsync(me.UserId, wallet, default)).Value!.BalanceCents);
        }
        finally
        {
            foreach (var id in new[] { main, savings, wallet })
            {
                await me.Accounts.DeleteAsync(me.UserId, id, default);
            }
        }
    }
}
