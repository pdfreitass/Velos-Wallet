using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Velos.Application.Abstractions;
using Velos.Application.Accounts;
using Velos.Application.Common;

namespace Velos.Infrastructure.Persistence;

/// <summary>
/// Contas pela sessão do usuário (RLS). Toda query filtra <c>user_id = {userId}</c> além da RLS:
/// é a primeira barreira contra IDOR (o id vem da URL). Saldo lido da view, soma no SQL.
/// </summary>
internal sealed class AccountStore(UserDbSession session, ILogger<AccountStore> logger) : IAccountStore
{
    public Task<Result<IReadOnlyList<AccountSummary>>> ListAsync(Guid userId, CancellationToken cancellationToken) =>
        StoreGuard.RunAsync<IReadOnlyList<AccountSummary>>(logger, "listar contas", async () =>
        {
            var rows = await session.AsUserAsync(
                (db, ct) => db.Database.SqlQuery<AccountRow>($"""
                    select account_id as "Id", name as "Name", type::text as "Type",
                           initial_balance_cents as "InitialBalanceCents", balance_cents as "BalanceCents"
                    from public.account_balances where user_id = {userId}
                    """).ToListAsync(ct),
                cancellationToken);
            return rows.Select(row => row.ToSummary()).OrderBy(account => account.Name, PgEnums.PtBr).ToList();
        });

    public Task<Result<AccountSummary?>> GetAsync(Guid userId, Guid accountId, CancellationToken cancellationToken) =>
        StoreGuard.RunAsync(logger, "abrir conta", async () =>
        {
            var row = await session.AsUserAsync(
                (db, ct) => db.Database.SqlQuery<AccountRow>($"""
                    select account_id as "Id", name as "Name", type::text as "Type",
                           initial_balance_cents as "InitialBalanceCents", balance_cents as "BalanceCents"
                    from public.account_balances where user_id = {userId} and account_id = {accountId}
                    """).SingleOrDefaultAsync(ct),
                cancellationToken);
            return row?.ToSummary();
        });

    public Task<Result<Guid>> CreateAsync(Guid userId, NewAccount account, CancellationToken cancellationToken) =>
        StoreGuard.RunAsync(logger, "criar conta", async () =>
        {
            // Id gerado aqui: "insert ... returning" não pode ser composto pelo SqlQuery do EF.
            var id = Guid.NewGuid();
            var type = PgEnums.ToDb(account.Type);
            await session.AsUserAsync(
                (db, ct) => db.Database.ExecuteSqlAsync($"""
                    insert into public.accounts (id, user_id, name, type, initial_balance_cents)
                    values ({id}, {userId}, {account.Name}, {type}::public.account_type, {account.InitialBalanceCents})
                    """, ct),
                cancellationToken);
            return id;
        });

    public Task<Result<bool>> UpdateAsync(Guid userId, Guid accountId, AccountChanges changes, CancellationToken cancellationToken) =>
        StoreGuard.RunAsync(logger, "editar conta", async () =>
        {
            var rows = await session.AsUserAsync(
                (db, ct) => db.Database.ExecuteSqlAsync($"""
                    update public.accounts
                    set name = {changes.Name}, initial_balance_cents = {changes.InitialBalanceCents}
                    where id = {accountId} and user_id = {userId}
                    """, ct),
                cancellationToken);
            return rows == 1;
        });

    public Task<Result<AccountDeletionImpact?>> GetDeletionImpactAsync(Guid userId, Guid accountId, CancellationToken cancellationToken) =>
        StoreGuard.RunAsync(logger, "impacto da exclusão da conta", () =>
            session.AsUserAsync(async (db, ct) =>
            {
                var exists = await db.Database.SqlQuery<int>($"""
                    select 1 as "Value" from public.accounts where id = {accountId} and user_id = {userId}
                    """).AnyAsync(ct);
                if (!exists) return null;

                // Os dois lados: a conta pode ser a origem (account_id) ou o destino (transfer_account_id).
                var counts = await db.Database.SqlQuery<ImpactRow>($"""
                    select count(*) filter (where type = 'income')::int   as "IncomeCount",
                           count(*) filter (where type = 'expense')::int  as "ExpenseCount",
                           count(*) filter (where type = 'transfer')::int as "TransferCount"
                    from public.transactions
                    where user_id = {userId} and (account_id = {accountId} or transfer_account_id = {accountId})
                    """).SingleAsync(ct);

                var affected = await db.Database.SqlQuery<AffectedRow>($"""
                    select distinct a.id as "Id", a.name as "Name"
                    from public.transactions t
                    join public.accounts a
                      on a.id = case when t.account_id = {accountId} then t.transfer_account_id else t.account_id end
                    where t.user_id = {userId} and a.user_id = {userId} and t.type = 'transfer'
                      and (t.account_id = {accountId} or t.transfer_account_id = {accountId})
                    """).ToListAsync(ct);

                return new AccountDeletionImpact(
                    counts.IncomeCount,
                    counts.ExpenseCount,
                    counts.TransferCount,
                    affected.Select(row => new AffectedAccount(row.Id, row.Name)).OrderBy(a => a.Name, PgEnums.PtBr).ToList());
            }, cancellationToken));

    public Task<Result<bool>> DeleteAsync(Guid userId, Guid accountId, CancellationToken cancellationToken) =>
        StoreGuard.RunAsync(logger, "excluir conta", async () =>
        {
            // As FKs de transactions são "on delete cascade" nos dois lados (0001).
            var rows = await session.AsUserAsync(
                (db, ct) => db.Database.ExecuteSqlAsync(
                    $"delete from public.accounts where id = {accountId} and user_id = {userId}", ct),
                cancellationToken);
            return rows == 1;
        });

    private sealed class AccountRow
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Type { get; set; } = string.Empty;

        public long InitialBalanceCents { get; set; }

        public long BalanceCents { get; set; }

        public AccountSummary ToSummary() =>
            new(Id, Name, PgEnums.ToAccountType(Type), InitialBalanceCents, BalanceCents);
    }

    private sealed class ImpactRow
    {
        public int IncomeCount { get; set; }

        public int ExpenseCount { get; set; }

        public int TransferCount { get; set; }
    }

    private sealed class AffectedRow
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = string.Empty;
    }
}
