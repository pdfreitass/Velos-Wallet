using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Velos.Application.Abstractions;
using Velos.Application.Common;
using Velos.Application.Simulation;

namespace Velos.Infrastructure.Persistence;

/// <summary>
/// A base da simulação (spec 012) pela sessão do usuário (RLS), com <c>where user_id = {userId}</c>
/// além dela. A média é somada no SQL (ADR 0006): o C# só repassa.
///
/// Não há view para isto, de propósito: a janela de meses depende de "hoje em São Paulo", e esse
/// fuso já tem fonte única no <c>TransactionRules</c>. Uma view teria de repetir
/// <c>America/Sao_Paulo</c> dentro do SQL e criar uma segunda fonte para a mesma regra. Os limites
/// chegam como parâmetro.
/// </summary>
internal sealed class SimulationStore(UserDbSession session, ILogger<SimulationStore> logger) : ISimulationStore
{
    public Task<Result<IReadOnlyList<CategoryAverage>>> GetAveragesAsync(
        Guid userId, DateOnly windowStart, DateOnly windowEnd, CancellationToken cancellationToken) =>
        StoreGuard.RunAsync<IReadOnlyList<CategoryAverage>>(logger, "base da simulação", async () =>
        {
            var rows = await session.AsUserAsync(
                (db, ct) => db.Database.SqlQuery<AverageRow>($"""
                    with meses as (
                      select t.category_id,
                             date_trunc('month', t.date)::date as mes,
                             sum(t.amount_cents)::bigint as gasto_cents
                      from public.transactions t
                      where t.user_id = {userId}
                        and t.type = 'expense'
                        and t.date >= {windowStart}
                        and t.date <  {windowEnd}
                      group by t.category_id, date_trunc('month', t.date)
                    )
                    select m.category_id as "CategoryId", c.name as "Name", c.color as "Color", c.icon as "Icon",
                           count(*)::int as "MonthsCounted",
                           round(sum(m.gasto_cents)::numeric / count(*))::bigint as "AverageCents"
                    from meses m
                    left join public.categories c on c.id = m.category_id and c.user_id = {userId}
                    group by m.category_id, c.name, c.color, c.icon
                    order by "AverageCents" desc, c.name
                    """).ToListAsync(ct),
                cancellationToken);

            return rows
                .Select(r => new CategoryAverage(r.CategoryId, r.Name, r.Color, r.Icon, r.MonthsCounted, r.AverageCents))
                .ToList();
        });

    private sealed class AverageRow
    {
        public Guid? CategoryId { get; set; }

        public string? Name { get; set; }

        public string? Color { get; set; }

        public string? Icon { get; set; }

        public int MonthsCounted { get; set; }

        public long AverageCents { get; set; }
    }
}
