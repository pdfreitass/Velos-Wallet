using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Velos.Application.Abstractions;
using Velos.Application.Common;
using Velos.Application.Goals;

namespace Velos.Infrastructure.Persistence;

/// <summary>
/// Metas e aportes pela sessão do usuário (RLS). Toda query filtra <c>user_id = {userId}</c> além da RLS
/// (primeira barreira contra IDOR). O progresso vem da view <c>goal_progress</c>, somado no SQL (ADR 0006).
/// </summary>
internal sealed class GoalStore(UserDbSession session, ILogger<GoalStore> logger) : IGoalStore
{
    /// <summary>Teto defensivo das listas (sem paginação no MVP).</summary>
    private const int MaxItems = 500;

    public Task<Result<IReadOnlyList<GoalProgress>>> ListAsync(Guid userId, CancellationToken cancellationToken) =>
        StoreGuard.RunAsync<IReadOnlyList<GoalProgress>>(logger, "listar metas", async () =>
        {
            // RN8: em andamento primeiro (prazo mais próximo; sem prazo por último), depois as atingidas.
            var rows = await session.AsUserAsync(
                (db, ct) => db.Database.SqlQuery<ProgressRow>($"""
                    select p.goal_id as "Id", p.name as "Name", p.target_cents as "TargetCents", p.deadline as "Deadline",
                           p.current_cents as "CurrentCents", p.contribution_count as "ContributionCount",
                           p.remaining_cents as "RemainingCents", p.excess_cents as "ExcessCents"
                    from public.goal_progress p
                    join public.goals g on g.id = p.goal_id and g.user_id = {userId}
                    where p.user_id = {userId}
                    order by (p.remaining_cents = 0), p.deadline asc nulls last, g.created_at
                    limit {MaxItems}
                    """).ToListAsync(ct),
                cancellationToken);
            return rows.Select(row => row.ToProgress()).ToList();
        });

    public Task<Result<GoalProgress?>> GetAsync(Guid userId, Guid goalId, CancellationToken cancellationToken) =>
        StoreGuard.RunAsync(logger, "abrir meta", async () =>
        {
            var row = await session.AsUserAsync(
                (db, ct) => db.Database.SqlQuery<ProgressRow>($"""
                    select goal_id as "Id", name as "Name", target_cents as "TargetCents", deadline as "Deadline",
                           current_cents as "CurrentCents", contribution_count as "ContributionCount",
                           remaining_cents as "RemainingCents", excess_cents as "ExcessCents"
                    from public.goal_progress where goal_id = {goalId} and user_id = {userId}
                    """).SingleOrDefaultAsync(ct),
                cancellationToken);
            return row?.ToProgress();
        });

    public Task<Result<IReadOnlyList<Contribution>>> ListContributionsAsync(Guid userId, Guid goalId, CancellationToken cancellationToken) =>
        StoreGuard.RunAsync<IReadOnlyList<Contribution>>(logger, "listar aportes", async () =>
        {
            var rows = await session.AsUserAsync(
                (db, ct) => db.Database.SqlQuery<ContributionRow>($"""
                    select id as "Id", amount_cents as "AmountCents", date as "Date"
                    from public.goal_contributions
                    where goal_id = {goalId} and user_id = {userId}
                    order by date desc, created_at desc
                    limit {MaxItems}
                    """).ToListAsync(ct),
                cancellationToken);
            return rows.Select(row => new Contribution(row.Id, row.AmountCents, row.Date)).ToList();
        });

    public Task<Result<Guid>> CreateAsync(Guid userId, GoalData data, CancellationToken cancellationToken) =>
        StoreGuard.RunAsync(logger, "criar meta", async () =>
        {
            // Id gerado aqui: "insert ... returning" não pode ser composto pelo SqlQuery do EF.
            var id = Guid.NewGuid();
            await session.AsUserAsync(
                (db, ct) => db.Database.ExecuteSqlAsync($"""
                    insert into public.goals (id, user_id, name, target_cents, deadline)
                    values ({id}, {userId}, {data.Name}, {data.TargetCents}, {data.Deadline})
                    """, ct),
                cancellationToken);
            return id;
        });

    public Task<Result<bool>> UpdateAsync(Guid userId, Guid goalId, GoalData data, CancellationToken cancellationToken) =>
        StoreGuard.RunAsync(logger, "editar meta", async () =>
        {
            var rows = await session.AsUserAsync(
                (db, ct) => db.Database.ExecuteSqlAsync($"""
                    update public.goals
                    set name = {data.Name}, target_cents = {data.TargetCents}, deadline = {data.Deadline}
                    where id = {goalId} and user_id = {userId}
                    """, ct),
                cancellationToken);
            return rows == 1;
        });

    public Task<Result<bool>> DeleteAsync(Guid userId, Guid goalId, CancellationToken cancellationToken) =>
        StoreGuard.RunAsync(logger, "excluir meta", async () =>
        {
            var rows = await session.AsUserAsync(
                (db, ct) => db.Database.ExecuteSqlAsync(
                    $"delete from public.goals where id = {goalId} and user_id = {userId}", ct),
                cancellationToken);
            return rows == 1;
        });

    public Task<Result<Guid?>> AddContributionAsync(Guid userId, Guid goalId, ContributionData data, CancellationToken cancellationToken) =>
        StoreGuard.RunAsync<Guid?>(logger, "registrar aporte", async () =>
        {
            // Só entra se a meta for do usuário: 0 linhas = meta inexistente ou de outra pessoa (404).
            var id = Guid.NewGuid();
            var rows = await session.AsUserAsync(
                (db, ct) => db.Database.ExecuteSqlAsync($"""
                    insert into public.goal_contributions (id, user_id, goal_id, amount_cents, date)
                    select {id}, {userId}, {goalId}, {data.AmountCents}, {data.Date}
                    where exists (select 1 from public.goals where id = {goalId} and user_id = {userId})
                    """, ct),
                cancellationToken);
            return rows == 1 ? id : null;
        });

    public Task<Result<bool>> UpdateContributionAsync(
        Guid userId, Guid goalId, Guid contributionId, ContributionData data, CancellationToken cancellationToken) =>
        StoreGuard.RunAsync(logger, "editar aporte", async () =>
        {
            var rows = await session.AsUserAsync(
                (db, ct) => db.Database.ExecuteSqlAsync($"""
                    update public.goal_contributions
                    set amount_cents = {data.AmountCents}, date = {data.Date}
                    where id = {contributionId} and goal_id = {goalId} and user_id = {userId}
                    """, ct),
                cancellationToken);
            return rows == 1;
        });

    public Task<Result<bool>> DeleteContributionAsync(Guid userId, Guid goalId, Guid contributionId, CancellationToken cancellationToken) =>
        StoreGuard.RunAsync(logger, "excluir aporte", async () =>
        {
            var rows = await session.AsUserAsync(
                (db, ct) => db.Database.ExecuteSqlAsync($"""
                    delete from public.goal_contributions
                    where id = {contributionId} and goal_id = {goalId} and user_id = {userId}
                    """, ct),
                cancellationToken);
            return rows == 1;
        });

    private sealed class ProgressRow
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public long TargetCents { get; set; }

        public DateOnly? Deadline { get; set; }

        public long CurrentCents { get; set; }

        public int ContributionCount { get; set; }

        public long RemainingCents { get; set; }

        public long ExcessCents { get; set; }

        public GoalProgress ToProgress() =>
            new(Id, Name, TargetCents, Deadline, CurrentCents, ContributionCount, RemainingCents, ExcessCents);
    }

    private sealed class ContributionRow
    {
        public Guid Id { get; set; }

        public long AmountCents { get; set; }

        public DateOnly Date { get; set; }
    }
}
