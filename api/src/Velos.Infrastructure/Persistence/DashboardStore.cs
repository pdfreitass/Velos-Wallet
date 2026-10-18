using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Velos.Application.Abstractions;
using Velos.Application.Common;
using Velos.Application.Dashboard;

namespace Velos.Infrastructure.Persistence;

/// <summary>
/// Os números do Início pela sessão do usuário (RLS), com <c>where user_id = {userId}</c> em toda
/// query. Toda soma acontece no SQL (ADR 0006): o C# só repassa.
/// </summary>
internal sealed class DashboardStore(UserDbSession session, ILogger<DashboardStore> logger) : IDashboardStore
{
    public Task<Result<BalanceTotals>> GetBalancesAsync(Guid userId, CancellationToken cancellationToken) =>
        StoreGuard.RunAsync(logger, "saldos do início", async () =>
        {
            // RN1: o cartão fica fora do saldo total (ADR 0007). RN2: a dívida é o saldo do cartão com o
            // sinal trocado; um cartão com crédito (saldo positivo) não vira dívida negativa.
            var row = await session.AsUserAsync(
                (db, ct) => db.Database.SqlQuery<BalanceRow>($"""
                    select count(*) filter (where type <> 'credit_card')::int as "AccountCount",
                           count(*) filter (where type = 'credit_card')::int  as "CreditCardCount",
                           coalesce(sum(balance_cents) filter (where type <> 'credit_card'), 0)::bigint
                             as "TotalBalanceCents",
                           coalesce(sum(greatest(-balance_cents, 0)) filter (where type = 'credit_card'), 0)::bigint
                             as "CreditCardDebtCents"
                    from public.account_balances where user_id = {userId}
                    """).SingleAsync(ct),
                cancellationToken);
            return new BalanceTotals(row.AccountCount, row.CreditCardCount, row.TotalBalanceCents, row.CreditCardDebtCents);
        });

    public Task<Result<MonthResult>> GetMonthResultAsync(Guid userId, DateOnly monthStart, CancellationToken cancellationToken) =>
        StoreGuard.RunAsync(logger, "resultado do mês", async () =>
        {
            var row = await session.AsUserAsync(
                (db, ct) => db.Database.SqlQuery<MonthRow>($"""
                    select income_cents as "IncomeCents", expense_cents as "ExpenseCents",
                           (income_cents - expense_cents)::bigint as "NetCents"
                    from public.monthly_summary where user_id = {userId} and month = {monthStart}
                    """).SingleOrDefaultAsync(ct),
                cancellationToken);
            return row is null ? new MonthResult(0, 0, 0) : new MonthResult(row.IncomeCents, row.ExpenseCents, row.NetCents);
        });

    public Task<Result<IReadOnlyList<CategorySpending>>> GetCategorySpendingAsync(
        Guid userId, DateOnly monthStart, CancellationToken cancellationToken) =>
        StoreGuard.RunAsync<IReadOnlyList<CategorySpending>>(logger, "gastos por categoria", async () =>
        {
            var rows = await session.AsUserAsync(
                (db, ct) => db.Database.SqlQuery<SpendingRow>($"""
                    select s.category_id as "CategoryId", c.name as "Name", c.color as "Color", c.icon as "Icon",
                           s.expense_cents as "AmountCents"
                    from public.category_spending s
                    left join public.categories c on c.id = s.category_id and c.user_id = {userId}
                    where s.user_id = {userId} and s.month = {monthStart}
                    order by s.expense_cents desc, c.name
                    """).ToListAsync(ct),
                cancellationToken);
            return rows.Select(r => new CategorySpending(r.CategoryId, r.Name, r.Color, r.Icon, r.AmountCents)).ToList();
        });

    private sealed class BalanceRow
    {
        public int AccountCount { get; set; }

        public int CreditCardCount { get; set; }

        public long TotalBalanceCents { get; set; }

        public long CreditCardDebtCents { get; set; }
    }

    private sealed class MonthRow
    {
        public long IncomeCents { get; set; }

        public long ExpenseCents { get; set; }

        public long NetCents { get; set; }
    }

    private sealed class SpendingRow
    {
        public Guid? CategoryId { get; set; }

        public string? Name { get; set; }

        public string? Color { get; set; }

        public string? Icon { get; set; }

        public long AmountCents { get; set; }
    }
}
