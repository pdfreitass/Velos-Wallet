using Velos.Application.Accounts;
using Velos.Application.Categories;
using Velos.Application.Transactions;
using Velos.Domain.Accounts;
using Velos.Domain.Categories;
using Velos.Domain.Transactions;

namespace Velos.Infrastructure.IntegrationTests;

/// <summary>
/// <see cref="Persistence.SimulationStore"/> contra o banco real (spec 012). A média é somada e
/// arredondada <b>no SQL</b>, e é aí que mora o risco desta feature: <c>sum / count</c> em
/// <c>bigint</c> truncaria centavos a cada categoria, sempre para baixo. Só o Postgres prova isso.
///
/// Usa 2001 para não misturar com dados de verdade.
/// </summary>
public class SimulationStoreTests
{
    private static readonly DateOnly JanelaInicio = new(2001, 5, 1);

    /// <summary>Exclusivo: maio, junho e julho entram; agosto não.</summary>
    private static readonly DateOnly JanelaFim = new(2001, 8, 1);

    /// <summary>CA1: R$ 300 + R$ 400 + R$ 500 em 3 meses ⇒ média de R$ 400,00, com MonthsCounted 3.</summary>
    [DatabaseFact(RequiresTestUser = true)]
    public async Task A_media_de_tres_meses_e_somada_no_banco()
    {
        await using var me = StoreTestContext.Me();
        var conta = await NewAccountAsync(me);
        var lazer = await NewCategoryAsync(me, "Lazer");
        try
        {
            await CreateAsync(me, 30_000, new DateOnly(2001, 5, 10), conta, lazer);
            await CreateAsync(me, 40_000, new DateOnly(2001, 6, 10), conta, lazer);
            await CreateAsync(me, 50_000, new DateOnly(2001, 7, 10), conta, lazer);
            // Fora da janela: agosto é o "mês corrente" deste cenário e não pode entrar (RN1, CA5).
            await CreateAsync(me, 99_900, new DateOnly(2001, 8, 10), conta, lazer);
            // Abril é anterior à janela.
            await CreateAsync(me, 99_900, new DateOnly(2001, 4, 10), conta, lazer);

            var media = Assert.Single(await AveragesAsync(me, lazer));

            Assert.Equal(40_000, media.AverageCents);
            Assert.Equal(3, media.MonthsCounted);
            Assert.Equal("Lazer", media.Name?[..5]);
        }
        finally
        {
            await CleanUpAsync(me, conta, lazer);
        }
    }

    /// <summary>
    /// RN6 pela raiz: três meses que somam R$ 100,01 dão média de 3333,67 centavos. Com divisão
    /// inteira viria 3333; o <c>round(…::numeric / count(*))</c> devolve 3334.
    /// </summary>
    [DatabaseFact(RequiresTestUser = true)]
    public async Task A_media_arredonda_em_vez_de_truncar()
    {
        await using var me = StoreTestContext.Me();
        var conta = await NewAccountAsync(me);
        var categoria = await NewCategoryAsync(me, "Arredonda");
        try
        {
            await CreateAsync(me, 3_334, new DateOnly(2001, 5, 10), conta, categoria);
            await CreateAsync(me, 3_334, new DateOnly(2001, 6, 10), conta, categoria);
            await CreateAsync(me, 3_333, new DateOnly(2001, 7, 10), conta, categoria);

            Assert.Equal(3_334, Assert.Single(await AveragesAsync(me, categoria)).AverageCents);
        }
        finally
        {
            await CleanUpAsync(me, conta, categoria);
        }
    }

    /// <summary>CA4 e RN5: um mês só é média de um mês, e isso é dito, não escondido.</summary>
    [DatabaseFact(RequiresTestUser = true)]
    public async Task Um_mes_so_conta_como_um_mes()
    {
        await using var me = StoreTestContext.Me();
        var conta = await NewAccountAsync(me);
        var categoria = await NewCategoryAsync(me, "UmMes");
        try
        {
            await CreateAsync(me, 12_345, new DateOnly(2001, 6, 10), conta, categoria);

            var media = Assert.Single(await AveragesAsync(me, categoria));

            Assert.Equal(12_345, media.AverageCents);
            Assert.Equal(1, media.MonthsCounted);
        }
        finally
        {
            await CleanUpAsync(me, conta, categoria);
        }
    }

    /// <summary>
    /// RN10: receita e transferência não são gasto e ficam fora da base.
    ///
    /// A receita vai numa categoria de receita porque o app recusa categoria de despesa numa
    /// receita (spec 002) — o que também quer dizer que uma categoria de receita nunca deveria
    /// aparecer aqui.
    /// </summary>
    [DatabaseFact(RequiresTestUser = true)]
    public async Task Receita_e_transferencia_ficam_de_fora()
    {
        await using var me = StoreTestContext.Me();
        var conta = await NewAccountAsync(me);
        var destino = await NewAccountAsync(me);
        var despesa = await NewCategoryAsync(me, "SoDespesa");
        var salario = (await me.Categories.CreateAsync(
            me.UserId,
            new NewCategory(StoreTestContext.UniqueName("Salario"), CategoryType.Income, "#2ED38C", "wallet"),
            default)).Value;
        try
        {
            await CreateAsync(me, 30_000, new DateOnly(2001, 5, 10), conta, despesa);
            await CreateAsync(me, 500_000, new DateOnly(2001, 6, 10), conta, salario, TransactionType.Income);
            await me.Transactions.CreateAsync(
                me.UserId,
                new TransactionData(TransactionType.Transfer, 70_000, new DateOnly(2001, 6, 11), null, conta, destino, null),
                default);

            // A despesa entra, com o seu único mês…
            var media = Assert.Single(await AveragesAsync(me, despesa));
            Assert.Equal(30_000, media.AverageCents);
            Assert.Equal(1, media.MonthsCounted);

            // …e a categoria da receita não aparece de todo.
            Assert.Empty(await AveragesAsync(me, salario));
        }
        finally
        {
            await me.Accounts.DeleteAsync(me.UserId, destino, default);
            await me.Categories.DeleteAsync(me.UserId, salario, default);
            await CleanUpAsync(me, conta, despesa);
        }
    }

    /// <summary>CA-seg: a RLS cuida disto, e é o teste que prova.</summary>
    [DatabaseFact(RequiresTestUser = true)]
    public async Task Outro_usuario_nao_ve_nada()
    {
        await using var stranger = StoreTestContext.Stranger();

        var result = await stranger.Simulation.GetAveragesAsync(stranger.UserId, JanelaInicio, JanelaFim, default);

        Assert.True(result.IsSuccess);
        Assert.Empty(result.Value!);
    }

    private static async Task<IEnumerable<Application.Simulation.CategoryAverage>> AveragesAsync(
        StoreTestContext me, Guid categoryId)
    {
        var result = await me.Simulation.GetAveragesAsync(me.UserId, JanelaInicio, JanelaFim, default);
        Assert.True(result.IsSuccess, result.Error?.Code);
        return result.Value!.Where(c => c.CategoryId == categoryId);
    }

    private static async Task<Guid> NewAccountAsync(StoreTestContext me) =>
        (await me.Accounts.CreateAsync(
            me.UserId, new NewAccount(StoreTestContext.UniqueName("Teste"), AccountType.Checking, 10_000_000), default)).Value;

    private static async Task<Guid> NewCategoryAsync(StoreTestContext me, string prefix) =>
        (await me.Categories.CreateAsync(
            me.UserId,
            new NewCategory(StoreTestContext.UniqueName(prefix), CategoryType.Expense, "#E5484D", "utensils"),
            default)).Value;

    private static async Task CreateAsync(
        StoreTestContext me, long cents, DateOnly date, Guid account, Guid category,
        TransactionType type = TransactionType.Expense)
    {
        var result = await me.Transactions.CreateAsync(
            me.UserId, new TransactionData(type, cents, date, null, account, null, category), default);
        Assert.True(result.IsSuccess, result.Error?.Code);
    }

    private static async Task CleanUpAsync(StoreTestContext me, Guid account, Guid category)
    {
        await me.Accounts.DeleteAsync(me.UserId, account, default);
        await me.Categories.DeleteAsync(me.UserId, category, default);
    }
}
