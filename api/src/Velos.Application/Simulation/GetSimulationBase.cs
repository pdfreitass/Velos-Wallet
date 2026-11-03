using Velos.Application.Abstractions;
using Velos.Application.Common;
using Velos.Domain.Transactions;

namespace Velos.Application.Simulation;

/// <summary>
/// A base de uma categoria para a simulação (spec 012). <c>CategoryId</c> nulo é "Sem categoria"
/// (RN9), como no Início.
/// </summary>
/// <param name="MonthsCounted">
/// Em quantos dos meses da janela esta categoria teve despesa. É o que a tela diz ao usuário
/// quando a média se apoia em pouco dado (RN5) — não é o tamanho da janela.
/// </param>
/// <param name="AverageCents">Média mensal somada e arredondada no banco (ADR 0006).</param>
public sealed record CategoryAverage(
    Guid? CategoryId, string? Name, string? Color, string? Icon, int MonthsCounted, long AverageCents);

/// <summary>
/// O que a tela de simulação precisa para calcular tudo em memória (CA6): uma chamada ao abrir,
/// nenhuma a cada ajuste do percentual.
/// </summary>
/// <param name="WindowMonths">Tamanho da janela considerada (RN1). Hoje, 3.</param>
/// <param name="Categories">
/// Vazia quando não há nenhum mês completo com despesa: é o estado de dados insuficientes (RN4),
/// e o handler não inventa número nenhum para preenchê-lo.
/// </param>
public sealed record SimulationBase(int WindowMonths, IReadOnlyList<CategoryAverage> Categories);

/// <summary>
/// RN1 da spec 012: a janela são os <see cref="WindowMonths"/> meses <b>completos</b> anteriores.
/// O mês corrente fica de fora de propósito — ele está incompleto e puxaria a média para baixo
/// todo dia 1 (CA5).
/// </summary>
public sealed class GetSimulationBaseHandler(IUserContext user, ISimulationStore store, TimeProvider time)
{
    /// <summary>RN1. Rever só com uso real: é o tipo de número que não se calibra no escuro.</summary>
    public const int WindowMonths = 3;

    public async Task<Result<SimulationBase>> HandleAsync(CancellationToken cancellationToken)
    {
        // "Hoje" é sempre de São Paulo, nunca do servidor — e esta é a única fonte desse fuso.
        var today = TransactionRules.Today(time);

        var currentMonthStart = new DateOnly(today.Year, today.Month, 1);
        var windowStart = currentMonthStart.AddMonths(-WindowMonths);

        var categories = await store.GetAveragesAsync(user.UserId, windowStart, currentMonthStart, cancellationToken);
        if (!categories.IsSuccess) return Result.Failure<SimulationBase>(categories.Error!);

        return Result.Success(new SimulationBase(WindowMonths, categories.Value));
    }
}
