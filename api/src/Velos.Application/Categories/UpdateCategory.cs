using FluentValidation;
using Velos.Application.Abstractions;
using Velos.Application.Common;
using Velos.Domain.Categories;

namespace Velos.Application.Categories;

/// <summary>O tipo não entra: não muda depois de criada (RN8).</summary>
public sealed record UpdateCategoryCommand(Guid CategoryId, string Name, string Color, string Icon);

public sealed class UpdateCategoryHandler(IValidator<CategoryInput> validator, IUserContext user, ICategoryStore categories)
{
    public async Task<Result<Unit>> HandleAsync(UpdateCategoryCommand command, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        var userId = user.UserId;

        // O tipo salvo entra na validação e na mensagem de nome repetido (CA9).
        var found = await categories.GetAsync(userId, command.CategoryId, cancellationToken);
        if (!found.IsSuccess) return Result.Failure<Unit>(found.Error!);
        if (found.Value is not { } category) return Result.Failure<Unit>(CategoryErrors.NotFound);

        var input = new CategoryInput((command.Name ?? string.Empty).Trim(), category.Type, command.Color, command.Icon);
        var validation = await validator.ValidateAsync(input, cancellationToken);
        if (!validation.IsValid) return Result.Failure<Unit>(ValidationErrors.From(validation));

        var updated = await categories.UpdateAsync(
            userId,
            command.CategoryId,
            new CategoryChanges(input.Name, CategoryCatalog.NormalizeColor(input.Color), input.Icon),
            cancellationToken);
        if (!updated.IsSuccess) return Result.Failure<Unit>(CategoryErrors.ForType(updated.Error!, category.Type));

        // Sumiu entre a leitura e a gravação (excluída em outra aba).
        return updated.Value ? Result.Ok() : Result.Failure<Unit>(CategoryErrors.NotFound);
    }
}
