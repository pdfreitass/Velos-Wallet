using Velos.Application.Accounts;
using Velos.Application.Categories;
using Velos.Domain.Accounts;
using Velos.Domain.Categories;

namespace Velos.Infrastructure.IntegrationTests;

/// <summary>
/// <see cref="Persistence.CategoryStore"/> contra o banco real (spec 002, T6). Grava de verdade e
/// apaga no <c>finally</c> tudo o que criou.
/// </summary>
public class CategoryStoreTests
{
    [DatabaseFact(RequiresTestUser = true)]
    public async Task Create_read_update_and_delete()
    {
        await using var me = StoreTestContext.Me();
        var name = StoreTestContext.UniqueName("Pets");
        var id = (await me.Categories.CreateAsync(me.UserId, new NewCategory(name, CategoryType.Expense, "#8A6A4F", "paw-print"), default)).Value;
        try
        {
            Assert.Equal(new CategorySummary(id, name, CategoryType.Expense, "#8A6A4F", "paw-print"),
                (await me.Categories.GetAsync(me.UserId, id, default)).Value);

            var list = (await me.Categories.ListAsync(me.UserId, default)).Value;
            Assert.Contains(list, category => category.Id == id);
            Assert.True(list.SkipWhile(c => c.Type == CategoryType.Expense).All(c => c.Type == CategoryType.Income));

            Assert.True((await me.Categories.UpdateAsync(me.UserId, id, new CategoryChanges(name + "!", "#C7A23A", "shopping-bag"), default)).Value);
            Assert.Equal(new CategorySummary(id, name + "!", CategoryType.Expense, "#C7A23A", "shopping-bag"),
                (await me.Categories.GetAsync(me.UserId, id, default)).Value);

            Assert.True((await me.Categories.DeleteAsync(me.UserId, id, default)).Value);
            Assert.Null((await me.Categories.GetAsync(me.UserId, id, default)).Value);
        }
        finally
        {
            await me.Categories.DeleteAsync(me.UserId, id, default);
        }
    }

    /// <summary>CA9: o índice da 0009 vira category_name_taken, só no mesmo tipo.</summary>
    [DatabaseFact(RequiresTestUser = true)]
    public async Task Name_is_unique_per_type_ignoring_case()
    {
        await using var me = StoreTestContext.Me();
        var name = StoreTestContext.UniqueName("Lazer");
        var expense = (await me.Categories.CreateAsync(me.UserId, new NewCategory(name, CategoryType.Expense, "#D94FA8", "film"), default)).Value;
        Guid? income = null;
        try
        {
            var repeated = await me.Categories.CreateAsync(me.UserId, new NewCategory(name.ToUpperInvariant(), CategoryType.Expense, "#D94FA8", "film"), default);
            Assert.Equal(CategoryErrors.NameTakenCode, repeated.Error!.Code);

            income = (await me.Categories.CreateAsync(me.UserId, new NewCategory(name, CategoryType.Income, "#D94FA8", "film"), default)).Value;

            var renamed = await me.Categories.UpdateAsync(me.UserId, expense, new CategoryChanges("Lazer", "#D94FA8", "film"), default);
            Assert.Equal(CategoryErrors.NameTakenCode, renamed.Error!.Code);   // "Lazer" padrão de despesa
        }
        finally
        {
            await me.Categories.DeleteAsync(me.UserId, expense, default);
            if (income is { } incomeId) await me.Categories.DeleteAsync(me.UserId, incomeId, default);
        }
    }

    [DatabaseFact(RequiresTestUser = true)]
    public async Task Another_user_cannot_read_change_or_delete()
    {
        await using var me = StoreTestContext.Me();
        await using var stranger = StoreTestContext.Stranger();
        var id = (await me.Categories.CreateAsync(me.UserId, new NewCategory(StoreTestContext.UniqueName("Minha"), CategoryType.Income, "#1C7F54", "wallet"), default)).Value;
        try
        {
            Assert.Null((await stranger.Categories.GetAsync(stranger.UserId, id, default)).Value);
            Assert.Empty((await stranger.Categories.ListAsync(stranger.UserId, default)).Value);
            Assert.False((await stranger.Categories.UpdateAsync(stranger.UserId, id, new CategoryChanges("Roubada", "#1C7F54", "wallet"), default)).Value);
            Assert.Null((await stranger.Categories.GetDeletionImpactAsync(stranger.UserId, id, default)).Value);
            Assert.False((await stranger.Categories.DeleteAsync(stranger.UserId, id, default)).Value);

            // Só a RLS: sessão do outro usuário com o MEU id no filtro.
            Assert.Null((await stranger.Categories.GetAsync(me.UserId, id, default)).Value);
            Assert.NotNull((await me.Categories.GetAsync(me.UserId, id, default)).Value);
        }
        finally
        {
            await me.Categories.DeleteAsync(me.UserId, id, default);
        }
    }

    /// <summary>RN11 / CA10: a transação fica, como "Sem categoria".</summary>
    [DatabaseFact(RequiresTestUser = true)]
    public async Task Delete_keeps_the_transactions_without_category()
    {
        await using var me = StoreTestContext.Me();
        var account = (await me.Accounts.CreateAsync(me.UserId, new NewAccount("Conta RN11", AccountType.Cash, 0), default)).Value;
        var category = (await me.Categories.CreateAsync(me.UserId, new NewCategory(StoreTestContext.UniqueName("RN11"), CategoryType.Expense, "#E8833A", "tag"), default)).Value;
        try
        {
            await me.AddTransactionAsync("expense", account, 1_000, categoryId: category);
            await me.AddTransactionAsync("expense", account, 2_000, categoryId: category);

            Assert.Equal(new CategoryDeletionImpact(2), (await me.Categories.GetDeletionImpactAsync(me.UserId, category, default)).Value);
            Assert.True((await me.Categories.DeleteAsync(me.UserId, category, default)).Value);

            Assert.Equal(-3_000, (await me.Accounts.GetAsync(me.UserId, account, default)).Value!.BalanceCents);
        }
        finally
        {
            await me.Categories.DeleteAsync(me.UserId, category, default);
            await me.Accounts.DeleteAsync(me.UserId, account, default);   // leva as transações
        }
    }
}
