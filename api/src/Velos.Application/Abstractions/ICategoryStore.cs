using Velos.Application.Categories;
using Velos.Application.Common;

namespace Velos.Application.Abstractions;

/// <summary>
/// Categorias do usuário no banco (spec 002). Mesmas regras do <see cref="IAccountStore"/>: o
/// <c>userId</c> vem do <see cref="IUserContext"/>, e alheia ou inexistente dão <c>null</c> / <c>false</c>.
/// Nome repetido no mesmo tipo (índice da 0009) volta como <see cref="CategoryErrors.NameTakenCode"/>.
/// </summary>
public interface ICategoryStore
{
    /// <summary>Ordenadas por tipo e nome (pt-BR).</summary>
    Task<Result<IReadOnlyList<CategorySummary>>> ListAsync(Guid userId, CancellationToken cancellationToken);

    Task<Result<CategorySummary?>> GetAsync(Guid userId, Guid categoryId, CancellationToken cancellationToken);

    Task<Result<Guid>> CreateAsync(Guid userId, NewCategory category, CancellationToken cancellationToken);

    /// <returns><c>false</c> se a categoria não existe para este usuário.</returns>
    Task<Result<bool>> UpdateAsync(Guid userId, Guid categoryId, CategoryChanges changes, CancellationToken cancellationToken);

    Task<Result<CategoryDeletionImpact?>> GetDeletionImpactAsync(Guid userId, Guid categoryId, CancellationToken cancellationToken);

    /// <summary>As transações ficam, com <c>category_id</c> nulo (RN11, migrations 0009 e 0010).</summary>
    /// <returns><c>false</c> se a categoria não existe para este usuário.</returns>
    Task<Result<bool>> DeleteAsync(Guid userId, Guid categoryId, CancellationToken cancellationToken);
}
