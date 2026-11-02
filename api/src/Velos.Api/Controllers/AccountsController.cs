using Microsoft.AspNetCore.Mvc;
using Velos.Api.Http;
using Velos.Application.Accounts;
using Velos.Domain.Accounts;

namespace Velos.Api.Controllers;

/// <summary>Saldo inicial COM sinal: o front converte a dívida do cartão e o cheque especial (RN3).</summary>
public sealed record CreateAccountRequest(string? Name, string? Type, long InitialBalanceCents);

/// <summary>Sem o tipo: não muda depois de criada (RN1).</summary>
public sealed record UpdateAccountRequest(string? Name, long InitialBalanceCents);

/// <summary>
/// Contas (spec 002). Privado pela FallbackPolicy; mutações exigem o header CSRF. O dono é sempre o
/// usuário do JWT (os handlers usam o IUserContext). Id que não é GUID não casa a rota: 404, igual a
/// inexistente ou de outra pessoa (CA11).
/// </summary>
[ApiController]
[Route("api/accounts")]
public sealed class AccountsController : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromServices] ListAccountsHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblem(result.Error!);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, [FromServices] GetAccountHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblem(result.Error!);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        CreateAccountRequest request, [FromServices] CreateAccountHandler handler, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        var result = await handler.HandleAsync(
            new CreateAccountCommand(request.Name ?? "", ApiEnums.Parse<AccountType>(request.Type), request.InitialBalanceCents),
            cancellationToken);

        return result.IsSuccess
            ? CreatedAtAction(nameof(Get), new { id = result.Value }, new { id = result.Value })
            : this.ToProblem(result.Error!);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id, UpdateAccountRequest request, [FromServices] UpdateAccountHandler handler, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        var result = await handler.HandleAsync(
            new UpdateAccountCommand(id, request.Name ?? "", request.InitialBalanceCents), cancellationToken);
        return result.IsSuccess ? NoContent() : this.ToProblem(result.Error!);
    }

    [HttpGet("{id:guid}/deletion-impact")]
    public async Task<IActionResult> GetDeletionImpact(
        Guid id, [FromServices] GetAccountDeletionImpactHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblem(result.Error!);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, [FromServices] DeleteAccountHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, cancellationToken);
        return result.IsSuccess ? NoContent() : this.ToProblem(result.Error!);
    }
}
