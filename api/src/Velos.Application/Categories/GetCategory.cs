using Velos.Application.Abstractions;
using Velos.Application.Common;

namespace Velos.Application.Categories;

public sealed class GetCategoryHandler(IUserContext user, ICategoryStore categories)
{
    public async Task<Result<CategorySummary>> HandleAsync(Guid categoryId, CancellationToken cancellationToken)
    {
        var found = await categories.GetAsync(user.UserId, categoryId, cancellationToken);
        if (!found.IsSuccess) return Result.Failure<CategorySummary>(found.Error!);

        return found.Value is { } category
            ? Result.Success(category)
            : Result.Failure<CategorySummary>(CategoryErrors.NotFound);
    }
}
