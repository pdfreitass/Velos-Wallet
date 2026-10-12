using Microsoft.AspNetCore.Mvc;
using Velos.Api.Http;
using Velos.Application.Profiles;

namespace Velos.Api.Controllers;

/// <summary>Usuário logado (privado pela FallbackPolicy: sem sessão, 401).</summary>
[ApiController]
[Route("api/me")]
public sealed class MeController : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromServices] GetCurrentProfileHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblem(result.Error!);
    }
}
