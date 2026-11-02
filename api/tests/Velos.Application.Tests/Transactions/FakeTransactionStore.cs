using Velos.Application.Abstractions;
using Velos.Application.Common;
using Velos.Application.Transactions;
using Velos.Domain.Categories;

namespace Velos.Application.Tests.Transactions;

/// <summary>
/// Transações, contas e categorias em memória, com dono. Como a implementação real, o que é de outro
/// usuário responde igual a inexistente. Registra o <c>userId</c> de cada chamada.
/// </summary>
internal sealed class FakeTransactionStore : ITransactionStore
{
    private readonly Dictionary<Guid, (Guid Owner, TransactionDetail Transaction)> _transactions = [];
    private readonly Dictionary<Guid, Guid> _accounts = [];
    private readonly Dictionary<Guid, (Guid Owner, CategoryType Type)> _categories = [];

    public List<Guid> UserIds { get; } = [];

    public List<string> Calls { get; } = [];

    /// <summary>Quando definido, toda chamada falha com este erro (banco fora do ar).</summary>
    public AppError? Failure { get; set; }

    public MonthTotals Totals { get; set; } = new(0, 0);

    public TransactionData? LastSaved { get; private set; }

    public Guid AddAccount(Guid owner)
    {
        var id = Guid.NewGuid();
        _accounts[id] = owner;
        return id;
    }

    public Guid AddCategory(Guid owner, CategoryType type)
    {
        var id = Guid.NewGuid();
        _categories[id] = (owner, type);
        return id;
    }

    public TransactionDetail Add(Guid owner, TransactionDetail transaction)
    {
        _transactions[transaction.Id] = (owner, transaction);
        return transaction;
    }

    public TransactionDetail? Find(Guid id) => _transactions.TryGetValue(id, out var entry) ? entry.Transaction : null;

    public Task<Result<IReadOnlyList<TransactionListItem>>> ListMonthAsync(
        Guid userId, DateOnly monthStart, Guid? categoryId, CancellationToken cancellationToken)
    {
        Track(userId, $"list:{monthStart:yyyy-MM-dd}|{categoryId}");
        if (Failure is not null) return Task.FromResult(Result.Failure<IReadOnlyList<TransactionListItem>>(Failure));

        IReadOnlyList<TransactionListItem> items = [];
        return Task.FromResult(Result.Success(items));
    }

    public Task<Result<MonthTotals>> GetMonthTotalsAsync(Guid userId, DateOnly monthStart, CancellationToken cancellationToken)
    {
        Track(userId, $"totals:{monthStart:yyyy-MM-dd}");
        return Task.FromResult(Failure is null ? Result.Success(Totals) : Result.Failure<MonthTotals>(Failure));
    }

    public Task<Result<TransactionDetail?>> GetAsync(Guid userId, Guid transactionId, CancellationToken cancellationToken)
    {
        Track(userId, $"get:{transactionId}");
        if (Failure is not null) return Task.FromResult(Result.Failure<TransactionDetail?>(Failure));

        return Task.FromResult(Result.Success(Owned(userId, transactionId)));
    }

    public Task<Result<TransactionReferences>> GetReferencesAsync(
        Guid userId, Guid accountId, Guid? transferAccountId, Guid? categoryId, CancellationToken cancellationToken)
    {
        Track(userId, "references");
        if (Failure is not null) return Task.FromResult(Result.Failure<TransactionReferences>(Failure));

        var accountFound = _accounts.TryGetValue(accountId, out var owner) && owner == userId;
        var transferFound = transferAccountId is { } target && _accounts.TryGetValue(target, out var targetOwner) && targetOwner == userId;
        CategoryType? categoryType = categoryId is { } category && _categories.TryGetValue(category, out var entry) && entry.Owner == userId
            ? entry.Type
            : null;

        return Task.FromResult(Result.Success(new TransactionReferences(accountFound, transferFound, categoryType)));
    }

    public Task<Result<Guid>> CreateAsync(Guid userId, TransactionData data, CancellationToken cancellationToken)
    {
        Track(userId, $"create:{data.Type}|{data.AmountCents}");
        if (Failure is not null) return Task.FromResult(Result.Failure<Guid>(Failure));

        LastSaved = data;
        var created = Add(userId, ToDetail(Guid.NewGuid(), data));
        return Task.FromResult(Result.Success(created.Id));
    }

    public Task<Result<bool>> UpdateAsync(Guid userId, Guid transactionId, TransactionData data, CancellationToken cancellationToken)
    {
        Track(userId, $"update:{transactionId}|{data.Type}|{data.AmountCents}");
        if (Failure is not null) return Task.FromResult(Result.Failure<bool>(Failure));
        if (Owned(userId, transactionId) is null) return Task.FromResult(Result.Success(false));

        LastSaved = data;
        _transactions[transactionId] = (userId, ToDetail(transactionId, data));
        return Task.FromResult(Result.Success(true));
    }

    public Task<Result<bool>> DeleteAsync(Guid userId, Guid transactionId, CancellationToken cancellationToken)
    {
        Track(userId, $"delete:{transactionId}");
        if (Failure is not null) return Task.FromResult(Result.Failure<bool>(Failure));

        return Task.FromResult(Result.Success(Owned(userId, transactionId) is not null && _transactions.Remove(transactionId)));
    }

    private static TransactionDetail ToDetail(Guid id, TransactionData data) => new(
        id, data.Type, data.AmountCents, data.Date, data.Description, data.AccountId, data.TransferAccountId, data.CategoryId);

    private TransactionDetail? Owned(Guid userId, Guid transactionId) =>
        _transactions.TryGetValue(transactionId, out var entry) && entry.Owner == userId ? entry.Transaction : null;

    private void Track(Guid userId, string call)
    {
        UserIds.Add(userId);
        Calls.Add(call);
    }
}
