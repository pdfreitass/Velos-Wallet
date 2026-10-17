using Velos.Application.Abstractions;
using Velos.Application.Common;

namespace Velos.Application.Categories;

/// <summary>As transações continuam e passam a "Sem categoria" (RN11). Vale para as padrão também (P3).</summary>
public sealed class DeleteCategoryHandler(IUserContext user, ICategoryStore categories)
{
    public async Task<Result<Unit>> HandleAsync(Guid categoryId, CancellationToken cancellationToken)
    {
        var deleted = await categories.DeleteAsync(user.UserId, categoryId, cancellationToken);
        if (!deleted.IsSuccess) return Result.Failure<Unit>(deleted.Error!);

        return deleted.Value ? Result.Ok() : Result.Failure<Unit>(CategoryErrors.NotFound);
    }
}
