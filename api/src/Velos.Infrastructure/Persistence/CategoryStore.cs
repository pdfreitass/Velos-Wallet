using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Npgsql;
using Velos.Application.Abstractions;
using Velos.Application.Categories;
using Velos.Application.Common;

namespace Velos.Infrastructure.Persistence;

/// <summary>Categorias pela sessão do usuário (RLS), com o mesmo filtro <c>user_id</c> do <see cref="AccountStore"/>.</summary>
internal sealed class CategoryStore(UserDbSession session, ILogger<CategoryStore> logger) : ICategoryStore
{
    /// <summary>O índice da 0009 (sem maiúsculas) e o único original da 0001.</summary>
    private static readonly HashSet<string> NameIndexes =
        ["categories_user_lower_name_type_key", "categories_user_id_name_type_key"];

    public Task<Result<IReadOnlyList<CategorySummary>>> ListAsync(Guid userId, CancellationToken cancellationToken) =>
        StoreGuard.RunAsync<IReadOnlyList<CategorySummary>>(logger, "listar categorias", async () =>
        {
            var rows = await session.AsUserAsync(
                (db, ct) => db.Database.SqlQuery<CategoryRow>($"""
                    select id as "Id", name as "Name", type::text as "Type", color as "Color", icon as "Icon"
                    from public.categories where user_id = {userId}
                    """).ToListAsync(ct),
                cancellationToken);
            return rows.Select(row => row.ToSummary())
                .OrderBy(category => category.Type)
                .ThenBy(category => category.Name, PgEnums.PtBr)
                .ToList();
        });

    public Task<Result<CategorySummary?>> GetAsync(Guid userId, Guid categoryId, CancellationToken cancellationToken) =>
        StoreGuard.RunAsync(logger, "abrir categoria", async () =>
        {
            var row = await session.AsUserAsync(
                (db, ct) => db.Database.SqlQuery<CategoryRow>($"""
                    select id as "Id", name as "Name", type::text as "Type", color as "Color", icon as "Icon"
                    from public.categories where user_id = {userId} and id = {categoryId}
                    """).SingleOrDefaultAsync(ct),
                cancellationToken);
            return row?.ToSummary();
        });

    public Task<Result<Guid>> CreateAsync(Guid userId, NewCategory category, CancellationToken cancellationToken) =>
        StoreGuard.RunAsync(logger, "criar categoria", async () =>
        {
            var id = Guid.NewGuid();
            var type = PgEnums.ToDb(category.Type);
            await session.AsUserAsync(
                (db, ct) => db.Database.ExecuteSqlAsync($"""
                    insert into public.categories (id, user_id, name, type, color, icon)
                    values ({id}, {userId}, {category.Name}, {type}::public.transaction_type, {category.Color}, {category.Icon})
                    """, ct),
                cancellationToken);
            return id;
        }, NameTaken);

    public Task<Result<bool>> UpdateAsync(Guid userId, Guid categoryId, CategoryChanges changes, CancellationToken cancellationToken) =>
        StoreGuard.RunAsync(logger, "editar categoria", async () =>
        {
            var rows = await session.AsUserAsync(
                (db, ct) => db.Database.ExecuteSqlAsync($"""
                    update public.categories
                    set name = {changes.Name}, color = {changes.Color}, icon = {changes.Icon}
                    where id = {categoryId} and user_id = {userId}
                    """, ct),
                cancellationToken);
            return rows == 1;
        }, NameTaken);

    public Task<Result<CategoryDeletionImpact?>> GetDeletionImpactAsync(Guid userId, Guid categoryId, CancellationToken cancellationToken) =>
        StoreGuard.RunAsync(logger, "impacto da exclusão da categoria", () =>
            session.AsUserAsync(async (db, ct) =>
            {
                var exists = await db.Database.SqlQuery<int>($"""
                    select 1 as "Value" from public.categories where id = {categoryId} and user_id = {userId}
                    """).AnyAsync(ct);
                if (!exists) return null;

                var count = await db.Database.SqlQuery<int>($"""
                    select count(*)::int as "Value" from public.transactions
                    where user_id = {userId} and category_id = {categoryId}
                    """).SingleAsync(ct);
                return new CategoryDeletionImpact(count);
            }, cancellationToken));

    public Task<Result<bool>> DeleteAsync(Guid userId, Guid categoryId, CancellationToken cancellationToken) =>
        StoreGuard.RunAsync(logger, "excluir categoria", async () =>
        {
            // As transações ficam com category_id nulo (FKs "set null (category_id)", 0009 e 0010).
            var rows = await session.AsUserAsync(
                (db, ct) => db.Database.ExecuteSqlAsync(
                    $"delete from public.categories where id = {categoryId} and user_id = {userId}", ct),
                cancellationToken);
            return rows == 1;
        });

    /// <summary>O tipo não é conhecido aqui na edição: devolve o genérico e o handler troca (CA9).</summary>
    private static AppError? NameTaken(PostgresException exception) =>
        exception.SqlState == PostgresErrorCodes.UniqueViolation && NameIndexes.Contains(exception.ConstraintName ?? string.Empty)
            ? CategoryErrors.NameTaken(null)
            : null;

    private sealed class CategoryRow
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Type { get; set; } = string.Empty;

        public string Color { get; set; } = string.Empty;

        public string Icon { get; set; } = string.Empty;

        public CategorySummary ToSummary() => new(Id, Name, PgEnums.ToCategoryType(Type), Color, Icon);
    }
}
