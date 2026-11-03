using Velos.Application.Common;
using Velos.Application.Simulation;

namespace Velos.Application.Abstractions;

/// <summary>
/// A base da simulação (spec 012), com a média somada no banco (ADR 0006). O <c>userId</c> vem do
/// <see cref="IUserContext"/>; a implementação filtra por ele além da RLS.
/// </summary>
public interface ISimulationStore
{
    /// <summary>
    /// Média mensal de despesa por categoria no intervalo <c>[windowStart, windowEnd)</c>, da maior
    /// para a menor. O fim é <b>exclusivo</b>: quem chama passa o primeiro dia do mês corrente para
    /// o deixar de fora (RN1).
    /// </summary>
    /// <returns>Lista vazia quando não há despesa nenhuma na janela (RN4).</returns>
    Task<Result<IReadOnlyList<CategoryAverage>>> GetAveragesAsync(
        Guid userId, DateOnly windowStart, DateOnly windowEnd, CancellationToken cancellationToken);
}
