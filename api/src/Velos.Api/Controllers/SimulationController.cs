using Microsoft.AspNetCore.Mvc;
using Velos.Api.Http;
using Velos.Application.Simulation;

namespace Velos.Api.Controllers;

/// <summary>
/// A simulação de corte (spec 012). Só leitura; privado pela FallbackPolicy.
///
/// O endpoint devolve a <b>base</b>, não o resultado: o corte em si é aritmética que a tela faz em
/// memória enquanto a pessoa move o percentual (CA6), sobre números que vieram daqui.
/// </summary>
[ApiController]
[Route("api/simulation")]
public sealed class SimulationController : ControllerBase
{
    /// <summary>Média mensal de despesa por categoria nos meses completos da janela (RN1).</summary>
    [HttpGet("base")]
    public async Task<IActionResult> GetBase(
        [FromServices] GetSimulationBaseHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblem(result.Error!);
    }
}
