using Velos.Application.Abstractions;
using Velos.Application.Common;
using Velos.Application.Simulation;

namespace Velos.Application.Tests.Simulation;

/// <summary>
/// Spec 012: a janela são os 3 meses completos anteriores, o mês corrente fica fora (RN1, CA5), e
/// sem dado nenhum o handler devolve lista vazia em vez de inventar número (RN4, CA3).
/// </summary>
public class GetSimulationBaseHandlerTests
{
    private readonly FakeSimulationStore _store = new();

    private GetSimulationBaseHandler Handler(DateTimeOffset now) =>
        new(new FakeUserContext(), _store, new FixedTimeProvider(now));

    /// <summary>CA5: a janela vai do 1.º dia do 3.º mês atrás até o 1.º dia do mês corrente (exclusivo).</summary>
    [Fact]
    public async Task Ca5_a_janela_exclui_o_mes_corrente()
    {
        // 03/11/2026 às 10:00 UTC = 07:00 em São Paulo, ainda dia 3.
        await Handler(new DateTimeOffset(2026, 11, 3, 10, 0, 0, TimeSpan.Zero)).HandleAsync(default);

        // Agosto, setembro e outubro. Novembro, que está correndo, fica de fora.
        Assert.Equal(["averages:2026-08-01..2026-11-01"], _store.Calls);
    }

    /// <summary>A janela usa "hoje em São Paulo", não o dia do servidor em UTC.</summary>
    [Fact]
    public async Task A_virada_do_mes_segue_sao_paulo_e_nao_utc()
    {
        // 01/11 às 02:00 UTC já é novembro em UTC, mas ainda é 31/10 às 23:00 em São Paulo.
        await Handler(new DateTimeOffset(2026, 11, 1, 2, 0, 0, TimeSpan.Zero)).HandleAsync(default);

        // Logo o mês corrente é OUTUBRO, e a janela são julho, agosto e setembro.
        Assert.Equal(["averages:2026-07-01..2026-10-01"], _store.Calls);
    }

    /// <summary>CA3: sem nenhum mês completo com despesa, nada é simulável — e nada é inventado.</summary>
    [Fact]
    public async Task Ca3_sem_dado_a_lista_vem_vazia()
    {
        _store.Averages = [];

        var result = await Handler(DateTimeOffset.UtcNow).HandleAsync(default);

        Assert.True(result.IsSuccess);
        Assert.Empty(result.Value!.Categories);
        Assert.Equal(GetSimulationBaseHandler.WindowMonths, result.Value.WindowMonths);
    }

    /// <summary>CA4: com 1 mês só, a média sai, e o quanto ela se apoia vai junto (RN5).</summary>
    [Fact]
    public async Task Ca4_um_mes_so_e_repassado_com_a_contagem()
    {
        _store.Averages = [new CategoryAverage(Guid.NewGuid(), "Lazer", "#2ED38C", "popcorn", 1, 40_000)];

        var result = await Handler(DateTimeOffset.UtcNow).HandleAsync(default);

        var categoria = Assert.Single(result.Value!.Categories);
        Assert.Equal(1, categoria.MonthsCounted);
        Assert.Equal(40_000, categoria.AverageCents);
    }

    /// <summary>RN9: "Sem categoria" é um gasto real e entra na simulação.</summary>
    [Fact]
    public async Task Rn9_sem_categoria_e_repassada()
    {
        _store.Averages = [new CategoryAverage(null, null, null, null, 3, 12_000)];

        var result = await Handler(DateTimeOffset.UtcNow).HandleAsync(default);

        Assert.Null(Assert.Single(result.Value!.Categories).CategoryId);
    }

    [Fact]
    public async Task So_o_usuario_autenticado_e_consultado()
    {
        await Handler(DateTimeOffset.UtcNow).HandleAsync(default);

        Assert.All(_store.UserIds, id => Assert.Equal(FakeUserContext.DefaultUserId, id));
    }

    [Fact]
    public async Task Falha_do_banco_e_repassada()
    {
        _store.Failure = CommonErrors.DatabaseUnavailable;

        var result = await Handler(DateTimeOffset.UtcNow).HandleAsync(default);

        Assert.Equal(CommonErrors.DatabaseUnavailable, result.Error);
    }

    private sealed class FakeSimulationStore : ISimulationStore
    {
        public IReadOnlyList<CategoryAverage> Averages { get; set; } = [];

        public AppError? Failure { get; set; }

        public List<string> Calls { get; } = [];

        public List<Guid> UserIds { get; } = [];

        public Task<Result<IReadOnlyList<CategoryAverage>>> GetAveragesAsync(
            Guid userId, DateOnly windowStart, DateOnly windowEnd, CancellationToken cancellationToken)
        {
            UserIds.Add(userId);
            Calls.Add($"averages:{windowStart:yyyy-MM-dd}..{windowEnd:yyyy-MM-dd}");
            return Task.FromResult(
                Failure is null ? Result.Success(Averages) : Result.Failure<IReadOnlyList<CategoryAverage>>(Failure));
        }
    }
}
