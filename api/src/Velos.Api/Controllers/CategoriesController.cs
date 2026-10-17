using Microsoft.AspNetCore.Mvc;
using Velos.Api.Http;
using Velos.Application.Categories;
using Velos.Domain.Categories;

namespace Velos.Api.Controllers;

public sealed record CreateCategoryRequest(string? Name, string? Type, string? Color, string? Icon);

/// <summary>Sem o tipo: não muda depois de criada (RN8).</summary>
public sealed record UpdateCategoryRequest(string? Name, string? Color, string? Icon);

/// <summary>Categorias (spec 002). Mesmas garantias do <see cref="AccountsController"/>.</summary>
[ApiController]
[Route("api/categories")]
public sealed class CategoriesController : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromServices] ListCategoriesHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblem(result.Error!);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, [FromServices] GetCategoryHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblem(result.Error!);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        CreateCategoryRequest request, [FromServices] CreateCategoryHandler handler, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        var result = await handler.HandleAsync(
            new CreateCategoryCommand(
                request.Name ?? "", ApiEnums.Parse<CategoryType>(request.Type), request.Color ?? "", request.Icon ?? ""),
            cancellationToken);

        return result.IsSuccess
            ? CreatedAtAction(nameof(Get), new { id = result.Value }, new { id = result.Value })
            : this.ToProblem(result.Error!);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id, UpdateCategoryRequest request, [FromServices] UpdateCategoryHandler handler, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        var result = await handler.HandleAsync(
            new UpdateCategoryCommand(id, request.Name ?? "", request.Color ?? "", request.Icon ?? ""), cancellationToken);
        return result.IsSuccess ? NoContent() : this.ToProblem(result.Error!);
    }

    [HttpGet("{id:guid}/deletion-impact")]
    public async Task<IActionResult> GetDeletionImpact(
        Guid id, [FromServices] GetCategoryDeletionImpactHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblem(result.Error!);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, [FromServices] DeleteCategoryHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, cancellationToken);
        return result.IsSuccess ? NoContent() : this.ToProblem(result.Error!);
    }
}
