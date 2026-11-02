using Velos.Application.Abstractions;
using Velos.Application.Common;

namespace Velos.Application.Categories;

public sealed class ListCategoriesHandler(IUserContext user, ICategoryStore categories)
{
    public Task<Result<IReadOnlyList<CategorySummary>>> HandleAsync(CancellationToken cancellationToken) =>
        categories.ListAsync(user.UserId, cancellationToken);
}
