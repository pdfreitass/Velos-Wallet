using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Velos.Application.Abstractions;
using Velos.Application.Common;
using Velos.Application.Transactions;
using Velos.Domain.Transactions;

namespace Velos.Infrastructure.Persistence;

/// <summary>
/// Transações pela sessão do usuário (RLS). Toda query filtra <c>user_id = {userId}</c> além da RLS,
/// inclusive nos joins (primeira barreira contra IDOR). Totais lidos da view, soma no SQL (ADR 0006).
/// </summary>
internal sealed class TransactionStore(UserDbSession session, ILogger<TransactionStore> logger) : ITransactionStore
{
    /// <summary>Teto defensivo da lista do mês (sem paginação no MVP; o mês é a página).</summary>
    private const int MaxMonthItems = 2000;

    public Task<Result<IReadOnlyList<TransactionListItem>>> ListMonthAsync(
        Guid userId, DateOnly monthStart, Guid? categoryId, CancellationToken cancellationToken) =>
        StoreGuard.RunAsync<IReadOnlyList<TransactionListItem>>(logger, "listar transações", async () =>
        {
            var monthEnd = monthStart.AddMonths(1);
            // O "::uuid" dá tipo ao parâmetro quando o filtro vem nulo. Os joins também filtram pelo usuário.
            var rows = await session.AsUserAsync(
                (db, ct) => db.Database.SqlQuery<ListRow>($"""
                    select t.id as "Id", t.type::text as "Type", t.amount_cents as "AmountCents", t.date as "Date",
                           t.description as "Description",
                           a.id as "AccountId", a.name as "AccountName",
                           ta.id as "TransferAccountId", ta.name as "TransferAccountName",
                           c.id as "CategoryId", c.name as "CategoryName", c.color as "CategoryColor", c.icon as "CategoryIcon"
                    from public.transactions t
                    join public.accounts a on a.id = t.account_id and a.user_id = {userId}
                    left join public.accounts ta on ta.id = t.transfer_account_id and ta.user_id = {userId}
                    left join public.categories c on c.id = t.category_id and c.user_id = {userId}
                    where t.user_id = {userId} and t.date >= {monthStart} and t.date < {monthEnd}
                      and ({categoryId}::uuid is null or t.category_id = {categoryId}::uuid)
                    order by t.date desc, t.created_at desc
                    limit {MaxMonthItems}
                    """).ToListAsync(ct),
                cancellationToken);
            return rows.Select(row => row.ToItem()).ToList();
        });

    public Task<Result<MonthTotals>> GetMonthTotalsAsync(Guid userId, DateOnly monthStart, CancellationToken cancellationToken) =>
        StoreGuard.RunAsync(logger, "totais do mês", async () =>
        {
            var row = await session.AsUserAsync(
                (db, ct) => db.Database.SqlQuery<TotalsRow>($"""
                    select income_cents as "IncomeCents", expense_cents as "ExpenseCents"
                    from public.monthly_summary where user_id = {userId} and month = {monthStart}
                    """).SingleOrDefaultAsync(ct),
                cancellationToken);
            return row is null ? new MonthTotals(0, 0) : new MonthTotals(row.IncomeCents, row.ExpenseCents);
        });

    public Task<Result<TransactionDetail?>> GetAsync(Guid userId, Guid transactionId, CancellationToken cancellationToken) =>
        StoreGuard.RunAsync(logger, "abrir transação", async () =>
        {
            var row = await session.AsUserAsync(
                (db, ct) => db.Database.SqlQuery<DetailRow>($"""
                    select id as "Id", type::text as "Type", amount_cents as "AmountCents", date as "Date",
                           description as "Description", account_id as "AccountId",
                           transfer_account_id as "TransferAccountId", category_id as "CategoryId"
                    from public.transactions where id = {transactionId} and user_id = {userId}
                    """).SingleOrDefaultAsync(ct),
                cancellationToken);
            return row?.ToDetail();
        });

    public Task<Result<TransactionReferences>> GetReferencesAsync(
        Guid userId, Guid accountId, Guid? transferAccountId, Guid? categoryId, CancellationToken cancellationToken) =>
        StoreGuard.RunAsync(logger, "conferir referências da transação", () =>
            session.AsUserAsync(async (db, ct) =>
            {
                var accountFound = await AccountExistsAsync(db, userId, accountId, ct);
                var transferFound = transferAccountId is { } target && await AccountExistsAsync(db, userId, target, ct);

                string? categoryType = null;
                if (categoryId is { } category)
                {
                    categoryType = await db.Database.SqlQuery<string>($"""
                        select type::text as "Value" from public.categories where id = {category} and user_id = {userId}
                        """).SingleOrDefaultAsync(ct);
                }

                return new TransactionReferences(
                    accountFound, transferFound, categoryType is null ? null : PgEnums.ToCategoryType(categoryType));
            }, cancellationToken));

    public Task<Result<Guid>> CreateAsync(Guid userId, TransactionData data, CancellationToken cancellationToken) =>
        StoreGuard.RunAsync(logger, "criar transação", async () =>
        {
            // Id gerado aqui: "insert ... returning" não pode ser composto pelo SqlQuery do EF.
            var id = Guid.NewGuid();
            var type = PgEnums.ToDb(data.Type);
            await session.AsUserAsync(
                (db, ct) => db.Database.ExecuteSqlAsync($"""
                    insert into public.transactions
                      (id, user_id, account_id, category_id, type, amount_cents, description, date, transfer_account_id)
                    values ({id}, {userId}, {data.AccountId}, {data.CategoryId}, {type}::public.transaction_type,
                            {data.AmountCents}, {data.Description}, {data.Date}, {data.TransferAccountId})
                    """, ct),
                cancellationToken);
            return id;
        });

    public Task<Result<bool>> UpdateAsync(Guid userId, Guid transactionId, TransactionData data, CancellationToken cancellationToken) =>
        StoreGuard.RunAsync(logger, "editar transação", async () =>
        {
            var type = PgEnums.ToDb(data.Type);
            var rows = await session.AsUserAsync(
                (db, ct) => db.Database.ExecuteSqlAsync($"""
                    update public.transactions
                    set type = {type}::public.transaction_type, amount_cents = {data.AmountCents},
                        date = {data.Date}, description = {data.Description}, account_id = {data.AccountId},
                        transfer_account_id = {data.TransferAccountId}, category_id = {data.CategoryId}
                    where id = {transactionId} and user_id = {userId}
                    """, ct),
                cancellationToken);
            return rows == 1;
        });

    public Task<Result<bool>> DeleteAsync(Guid userId, Guid transactionId, CancellationToken cancellationToken) =>
        StoreGuard.RunAsync(logger, "excluir transação", async () =>
        {
            var rows = await session.AsUserAsync(
                (db, ct) => db.Database.ExecuteSqlAsync(
                    $"delete from public.transactions where id = {transactionId} and user_id = {userId}", ct),
                cancellationToken);
            return rows == 1;
        });

    private static Task<bool> AccountExistsAsync(VelosDbContext db, Guid userId, Guid accountId, CancellationToken ct) =>
        db.Database.SqlQuery<int>($"""
            select 1 as "Value" from public.accounts where id = {accountId} and user_id = {userId}
            """).AnyAsync(ct);

    private sealed class ListRow
    {
        public Guid Id { get; set; }

        public string Type { get; set; } = string.Empty;

        public long AmountCents { get; set; }

        public DateOnly Date { get; set; }

        public string? Description { get; set; }

        public Guid AccountId { get; set; }

        public string AccountName { get; set; } = string.Empty;

        public Guid? TransferAccountId { get; set; }

        public string? TransferAccountName { get; set; }

        public Guid? CategoryId { get; set; }

        public string? CategoryName { get; set; }

        public string? CategoryColor { get; set; }

        public string? CategoryIcon { get; set; }

        public TransactionListItem ToItem() => new(
            Id,
            PgEnums.ToTransactionType(Type),
            AmountCents,
            Date,
            Description,
            new AccountRef(AccountId, AccountName),
            TransferAccountId is { } target ? new AccountRef(target, TransferAccountName ?? string.Empty) : null,
            CategoryId is { } category
                ? new CategoryRef(category, CategoryName ?? string.Empty, CategoryColor ?? string.Empty, CategoryIcon ?? string.Empty)
                : null);
    }

    private sealed class TotalsRow
    {
        public long IncomeCents { get; set; }

        public long ExpenseCents { get; set; }
    }

    private sealed class DetailRow
    {
        public Guid Id { get; set; }

        public string Type { get; set; } = string.Empty;

        public long AmountCents { get; set; }

        public DateOnly Date { get; set; }

        public string? Description { get; set; }

        public Guid AccountId { get; set; }

        public Guid? TransferAccountId { get; set; }

        public Guid? CategoryId { get; set; }

        public TransactionDetail ToDetail() => new(
            Id, PgEnums.ToTransactionType(Type), AmountCents, Date, Description, AccountId, TransferAccountId, CategoryId);
    }
}
