using Velos.Application.Abstractions;
using Velos.Application.Categories;
using Velos.Application.Common;

namespace Velos.Application.Tests.Categories;

/// <summary>
/// Categorias em memória, com dono. Imita o índice único (user_id, lower(name), type) da 0009
/// devolvendo o <see cref="CategoryErrors.NameTaken"/> genérico, como fará a implementação real.
/// </summary>
internal sealed class FakeCategoryStore : ICategoryStore
{
    private readonly Dictionary<Guid, (Guid Owner, CategorySummary Category)> _categories = [];

    public List<Guid> UserIds { get; } = [];

    public List<string> Calls { get; } = [];

    public AppError? Failure { get; set; }

    public int TransactionCount { get; set; }

    public CategorySummary Add(Guid owner, CategorySummary category)
    {
        _categories[category.Id] = (owner, category);
        return category;
    }

    public CategorySummary? Find(Guid id) => _categories.TryGetValue(id, out var entry) ? entry.Category : null;

    public Task<Result<IReadOnlyList<CategorySummary>>> ListAsync(Guid userId, CancellationToken cancellationToken)
    {
        Track(userId, "list");
        if (Failure is not null) return Task.FromResult(Result.Failure<IReadOnlyList<CategorySummary>>(Failure));

        IReadOnlyList<CategorySummary> mine = _categories.Values.Where(e => e.Owner == userId).Select(e => e.Category).ToList();
        return Task.FromResult(Result.Success(mine));
    }

    public Task<Result<CategorySummary?>> GetAsync(Guid userId, Guid categoryId, CancellationToken cancellationToken)
    {
        Track(userId, $"get:{categoryId}");
        if (Failure is not null) return Task.FromResult(Result.Failure<CategorySummary?>(Failure));

        return Task.FromResult(Result.Success(Owned(userId, categoryId)));
    }

    public Task<Result<Guid>> CreateAsync(Guid userId, NewCategory category, CancellationToken cancellationToken)
    {
        Track(userId, $"create:{category.Name}|{category.Type}|{category.Color}|{category.Icon}");
        if (Failure is not null) return Task.FromResult(Result.Failure<Guid>(Failure));

        var created = new CategorySummary(Guid.NewGuid(), category.Name, category.Type, category.Color, category.Icon);
        if (NameTaken(userId, created)) return Task.FromResult(Result.Failure<Guid>(CategoryErrors.NameTaken(null)));

        Add(userId, created);
        return Task.FromResult(Result.Success(created.Id));
    }

    public Task<Result<bool>> UpdateAsync(Guid userId, Guid categoryId, CategoryChanges changes, CancellationToken cancellationToken)
    {
        Track(userId, $"update:{categoryId}|{changes.Name}|{changes.Color}|{changes.Icon}");
        if (Failure is not null) return Task.FromResult(Result.Failure<bool>(Failure));
        if (Owned(userId, categoryId) is not { } category) return Task.FromResult(Result.Success(false));

        var changed = category with { Name = changes.Name, Color = changes.Color, Icon = changes.Icon };
        if (NameTaken(userId, changed)) return Task.FromResult(Result.Failure<bool>(CategoryErrors.NameTaken(null)));

        _categories[categoryId] = (userId, changed);
        return Task.FromResult(Result.Success(true));
    }

    public Task<Result<CategoryDeletionImpact?>> GetDeletionImpactAsync(Guid userId, Guid categoryId, CancellationToken cancellationToken)
    {
        Track(userId, $"impact:{categoryId}");
        if (Failure is not null) return Task.FromResult(Result.Failure<CategoryDeletionImpact?>(Failure));

        var impact = Owned(userId, categoryId) is null ? null : new CategoryDeletionImpact(TransactionCount);
        return Task.FromResult(Result.Success(impact));
    }

    public Task<Result<bool>> DeleteAsync(Guid userId, Guid categoryId, CancellationToken cancellationToken)
    {
        Track(userId, $"delete:{categoryId}");
        if (Failure is not null) return Task.FromResult(Result.Failure<bool>(Failure));

        return Task.FromResult(Result.Success(Owned(userId, categoryId) is not null && _categories.Remove(categoryId)));
    }

    private bool NameTaken(Guid userId, CategorySummary candidate) =>
        _categories.Values.Any(e => e.Owner == userId
                                    && e.Category.Id != candidate.Id
                                    && e.Category.Type == candidate.Type
                                    && string.Equals(e.Category.Name, candidate.Name, StringComparison.OrdinalIgnoreCase));

    private CategorySummary? Owned(Guid userId, Guid categoryId) =>
        _categories.TryGetValue(categoryId, out var entry) && entry.Owner == userId ? entry.Category : null;

    private void Track(Guid userId, string call)
    {
        UserIds.Add(userId);
        Calls.Add(call);
    }
}
