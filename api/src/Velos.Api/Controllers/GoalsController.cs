using Microsoft.AspNetCore.Mvc;
using Velos.Api.Http;
using Velos.Application.Goals;

namespace Velos.Api.Controllers;

/// <summary>Valor-alvo em centavos; prazo opcional em <c>yyyy-MM-dd</c>.</summary>
public sealed record SaveGoalRequest(string? Name, long TargetCents, DateOnly? Deadline)
{
    internal SaveGoalCommand ToCommand() => new(Name, TargetCents, Deadline);
}

/// <summary>Valor em centavos e data em <c>yyyy-MM-dd</c> (obrigatória).</summary>
public sealed record SaveContributionRequest(long AmountCents, DateOnly? Date)
{
    internal SaveContributionCommand ToCommand() => new(AmountCents, Date);
}

/// <summary>
/// Metas e aportes (spec 006). Privado pela FallbackPolicy; mutações exigem o header CSRF. O dono é
/// sempre o usuário do JWT (os handlers usam o IUserContext). Id que não é GUID não casa a rota: 404,
/// igual a inexistente ou de outra pessoa (CA-seg).
/// </summary>
[ApiController]
[Route("api/goals")]
public sealed class GoalsController : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromServices] ListGoalsHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblem(result.Error!);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, [FromServices] GetGoalHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblem(result.Error!);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        SaveGoalRequest request, [FromServices] CreateGoalHandler handler, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        var result = await handler.HandleAsync(request.ToCommand(), cancellationToken);

        return result.IsSuccess
            ? CreatedAtAction(nameof(Get), new { id = result.Value }, new { id = result.Value })
            : this.ToProblem(result.Error!);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id, SaveGoalRequest request, [FromServices] UpdateGoalHandler handler, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        var result = await handler.HandleAsync(id, request.ToCommand(), cancellationToken);
        return result.IsSuccess ? NoContent() : this.ToProblem(result.Error!);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, [FromServices] DeleteGoalHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, cancellationToken);
        return result.IsSuccess ? NoContent() : this.ToProblem(result.Error!);
    }

    [HttpPost("{id:guid}/contributions")]
    public async Task<IActionResult> AddContribution(
        Guid id, SaveContributionRequest request, [FromServices] AddContributionHandler handler, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        var result = await handler.HandleAsync(id, request.ToCommand(), cancellationToken);

        return result.IsSuccess
            ? CreatedAtAction(nameof(Get), new { id }, new { id = result.Value })
            : this.ToProblem(result.Error!);
    }

    [HttpPut("{id:guid}/contributions/{contributionId:guid}")]
    public async Task<IActionResult> UpdateContribution(
        Guid id,
        Guid contributionId,
        SaveContributionRequest request,
        [FromServices] UpdateContributionHandler handler,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        var result = await handler.HandleAsync(id, contributionId, request.ToCommand(), cancellationToken);
        return result.IsSuccess ? NoContent() : this.ToProblem(result.Error!);
    }

    [HttpDelete("{id:guid}/contributions/{contributionId:guid}")]
    public async Task<IActionResult> DeleteContribution(
        Guid id, Guid contributionId, [FromServices] DeleteContributionHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, contributionId, cancellationToken);
        return result.IsSuccess ? NoContent() : this.ToProblem(result.Error!);
    }
}
