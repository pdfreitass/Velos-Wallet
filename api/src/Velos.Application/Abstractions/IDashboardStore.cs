using Velos.Application.Common;
using Velos.Application.Dashboard;

namespace Velos.Application.Abstractions;

/// <summary>
/// Os números do Início (spec 005), SEMPRE somados no banco (ADR 0006). O <c>userId</c> vem do
/// <see cref="IUserContext"/>; a implementação filtra por ele além da RLS.
/// </summary>
public interface IDashboardStore
{
    /// <summary>Saldo total sem o cartão e a dívida do cartão (positiva quando há dívida).</summary>
    Task<Result<BalanceTotals>> GetBalancesAsync(Guid userId, CancellationToken cancellationToken);

    /// <summary>Zero quando o mês não tem receitas nem despesas.</summary>
    Task<Result<MonthResult>> GetMonthResultAsync(Guid userId, DateOnly monthStart, CancellationToken cancellationToken);

    /// <summary>Só despesas do mês, da maior para a menor.</summary>
    Task<Result<IReadOnlyList<CategorySpending>>> GetCategorySpendingAsync(
        Guid userId, DateOnly monthStart, CancellationToken cancellationToken);
}
