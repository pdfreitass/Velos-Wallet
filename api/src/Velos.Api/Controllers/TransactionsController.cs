using Microsoft.AspNetCore.Mvc;
using Velos.Api.Http;
using Velos.Application.Transactions;
using Velos.Domain.Transactions;

namespace Velos.Api.Controllers;

/// <summary>Valor positivo; o sentido vem do tipo (RN2). Data em <c>yyyy-MM-dd</c>.</summary>
public sealed record SaveTransactionRequest(
    string? Type,
    long AmountCents,
    DateOnly? Date,
    string? Description,
    Guid? AccountId,
    Guid? TransferAccountId,
    Guid? CategoryId)
{
    internal SaveTransactionCommand ToCommand() => new(
        ApiEnums.Parse<TransactionType>(Type), AmountCents, Date, Description, AccountId, TransferAccountId, CategoryId);
}

/// <summary>
/// Transações (spec 004). Privado pela FallbackPolicy; mutações exigem o header CSRF. O dono é sempre
/// o usuário do JWT (os handlers usam o IUserContext). Id que não é GUID não casa a rota: 404, igual a
/// inexistente ou de outra pessoa (CA11).
/// </summary>
[ApiController]
[Route("api/transactions")]
public sealed class TransactionsController : ControllerBase
{
    /// <param name="month">Mês em <c>yyyy-MM</c>; sem ele, o mês atual de São Paulo.</param>
    /// <param name="categoryId">Filtro por categoria (CA8). Os totais continuam do mês inteiro.</param>
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] string? month,
        [FromQuery] Guid? categoryId,
        [FromServices] ListTransactionsHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(month, categoryId, cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblem(result.Error!);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, [FromServices] GetTransactionHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblem(result.Error!);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        SaveTransactionRequest request, [FromServices] CreateTransactionHandler handler, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        var result = await handler.HandleAsync(request.ToCommand(), cancellationToken);

        return result.IsSuccess
            ? CreatedAtAction(nameof(Get), new { id = result.Value }, new { id = result.Value })
            : this.ToProblem(result.Error!);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id, SaveTransactionRequest request, [FromServices] UpdateTransactionHandler handler, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        var result = await handler.HandleAsync(id, request.ToCommand(), cancellationToken);
        return result.IsSuccess ? NoContent() : this.ToProblem(result.Error!);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, [FromServices] DeleteTransactionHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, cancellationToken);
        return result.IsSuccess ? NoContent() : this.ToProblem(result.Error!);
    }
}
