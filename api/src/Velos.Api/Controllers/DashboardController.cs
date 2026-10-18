using Microsoft.AspNetCore.Mvc;
using Velos.Api.Http;
using Velos.Application.Dashboard;

namespace Velos.Api.Controllers;

/// <summary>O Início (spec 005). Só leitura; privado pela FallbackPolicy.</summary>
[ApiController]
[Route("api/dashboard")]
public sealed class DashboardController : ControllerBase
{
    /// <param name="month">Mês em <c>yyyy-MM</c>; sem ele, o mês atual de São Paulo.</param>
    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] string? month, [FromServices] GetDashboardHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(month, cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblem(result.Error!);
    }
}
