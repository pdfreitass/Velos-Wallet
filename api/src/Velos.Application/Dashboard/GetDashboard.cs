using Velos.Application.Abstractions;
using Velos.Application.Common;

namespace Velos.Application.Dashboard;

/// <summary>Saldos de hoje (RN1, RN2 da spec 005). Somados no banco sobre a view account_balances.</summary>
public sealed record BalanceTotals(int AccountCount, int CreditCardCount, long TotalBalanceCents, long CreditCardDebtCents);

/// <summary>Receitas, despesas e resultado do mês (RN3), da view monthly_summary.</summary>
public sealed record MonthResult(long IncomeCents, long ExpenseCents, long NetCents);

/// <summary>Gasto de uma categoria no mês (RN4). Sem id = "Sem categoria" (a categoria foi excluída).</summary>
public sealed record CategorySpending(Guid? CategoryId, string? Name, string? Color, string? Icon, long AmountCents);

/// <summary>O Início (spec 005). Todos os números vieram somados do banco (RN5).</summary>
public sealed record DashboardSummary(
    string Month,
    int AccountCount,
    int CreditCardCount,
    long TotalBalanceCents,
    long CreditCardDebtCents,
    long IncomeCents,
    long ExpenseCents,
    long NetCents,
    IReadOnlyList<CategorySpending> Categories);

public sealed class GetDashboardHandler(IUserContext user, IDashboardStore dashboard, TimeProvider time)
{
    public async Task<Result<DashboardSummary>> HandleAsync(string? month, CancellationToken cancellationToken)
    {
        if (MonthKey.Parse(month, time) is not { } monthStart)
        {
            return Result.Failure<DashboardSummary>(ValidationErrors.Field("month", MonthKey.InvalidMessage));
        }

        var userId = user.UserId;
        var balances = await dashboard.GetBalancesAsync(userId, cancellationToken);
        if (!balances.IsSuccess) return Result.Failure<DashboardSummary>(balances.Error!);

        var result = await dashboard.GetMonthResultAsync(userId, monthStart, cancellationToken);
        if (!result.IsSuccess) return Result.Failure<DashboardSummary>(result.Error!);

        var categories = await dashboard.GetCategorySpendingAsync(userId, monthStart, cancellationToken);
        if (!categories.IsSuccess) return Result.Failure<DashboardSummary>(categories.Error!);

        var b = balances.Value;
        var r = result.Value;
        return Result.Success(new DashboardSummary(
            MonthKey.Format(monthStart),
            b.AccountCount, b.CreditCardCount, b.TotalBalanceCents, b.CreditCardDebtCents,
            r.IncomeCents, r.ExpenseCents, r.NetCents,
            categories.Value));
    }
}
