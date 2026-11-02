using Velos.Application.Abstractions;
using Velos.Application.Common;

namespace Velos.Application.Transactions;

/// <summary>
/// A lista do mês (RN7, CA7, CA8). <c>month</c> em <c>yyyy-MM</c>; sem ele, o mês atual de São Paulo.
/// Os totais são do mês inteiro, mesmo com o filtro por categoria.
/// </summary>
public sealed class ListTransactionsHandler(IUserContext user, ITransactionStore transactions, TimeProvider time)
{
    public async Task<Result<TransactionMonth>> HandleAsync(string? month, Guid? categoryId, CancellationToken cancellationToken)
    {
        if (MonthKey.Parse(month, time) is not { } monthStart)
        {
            return Result.Failure<TransactionMonth>(ValidationErrors.Field("month", MonthKey.InvalidMessage));
        }

        var userId = user.UserId;
        var items = await transactions.ListMonthAsync(userId, monthStart, categoryId, cancellationToken);
        if (!items.IsSuccess) return Result.Failure<TransactionMonth>(items.Error!);

        var totals = await transactions.GetMonthTotalsAsync(userId, monthStart, cancellationToken);
        if (!totals.IsSuccess) return Result.Failure<TransactionMonth>(totals.Error!);

        return Result.Success(new TransactionMonth(
            MonthKey.Format(monthStart),
            totals.Value.IncomeCents,
            totals.Value.ExpenseCents,
            items.Value));
    }
}

public sealed class GetTransactionHandler(IUserContext user, ITransactionStore transactions)
{
    public async Task<Result<TransactionDetail>> HandleAsync(Guid transactionId, CancellationToken cancellationToken)
    {
        var found = await transactions.GetAsync(user.UserId, transactionId, cancellationToken);
        if (!found.IsSuccess) return Result.Failure<TransactionDetail>(found.Error!);

        return found.Value is { } transaction
            ? Result.Success(transaction)
            : Result.Failure<TransactionDetail>(TransactionErrors.NotFound);
    }
}

/// <summary>RN9: some do saldo e dos totais. Sem desfazer.</summary>
public sealed class DeleteTransactionHandler(IUserContext user, ITransactionStore transactions)
{
    public async Task<Result<Unit>> HandleAsync(Guid transactionId, CancellationToken cancellationToken)
    {
        var deleted = await transactions.DeleteAsync(user.UserId, transactionId, cancellationToken);
        if (!deleted.IsSuccess) return Result.Failure<Unit>(deleted.Error!);

        return deleted.Value ? Result.Ok() : Result.Failure<Unit>(TransactionErrors.NotFound);
    }
}
