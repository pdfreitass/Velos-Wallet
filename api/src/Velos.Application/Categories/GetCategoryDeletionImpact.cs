using Velos.Application.Abstractions;
using Velos.Application.Common;

namespace Velos.Application.Categories;

/// <summary>RN11: quantas transações a confirmação de exclusão cita.</summary>
public sealed class GetCategoryDeletionImpactHandler(IUserContext user, ICategoryStore categories)
{
    public async Task<Result<CategoryDeletionImpact>> HandleAsync(Guid categoryId, CancellationToken cancellationToken)
    {
        var impact = await categories.GetDeletionImpactAsync(user.UserId, categoryId, cancellationToken);
        if (!impact.IsSuccess) return Result.Failure<CategoryDeletionImpact>(impact.Error!);

        return impact.Value is { } value
            ? Result.Success(value)
            : Result.Failure<CategoryDeletionImpact>(CategoryErrors.NotFound);
    }
}
