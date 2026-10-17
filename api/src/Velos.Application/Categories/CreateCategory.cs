using FluentValidation;
using Velos.Application.Abstractions;
using Velos.Application.Common;
using Velos.Domain.Categories;

namespace Velos.Application.Categories;

/// <summary>Não há campo de usuário: o dono é sempre o do JWT.</summary>
public sealed record CreateCategoryCommand(string Name, CategoryType? Type, string Color, string Icon);

public sealed class CreateCategoryHandler(IValidator<CategoryInput> validator, IUserContext user, ICategoryStore categories)
{
    public async Task<Result<Guid>> HandleAsync(CreateCategoryCommand command, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        var input = new CategoryInput((command.Name ?? string.Empty).Trim(), command.Type, command.Color, command.Icon);

        var validation = await validator.ValidateAsync(input, cancellationToken);
        if (!validation.IsValid) return Result.Failure<Guid>(ValidationErrors.From(validation));

        var type = input.Type!.Value;
        var created = await categories.CreateAsync(
            user.UserId,
            new NewCategory(input.Name, type, CategoryCatalog.NormalizeColor(input.Color), input.Icon),
            cancellationToken);

        return created.IsSuccess ? created : Result.Failure<Guid>(CategoryErrors.ForType(created.Error!, type));
    }
}
