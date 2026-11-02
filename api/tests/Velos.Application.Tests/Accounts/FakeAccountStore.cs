using Velos.Application.Abstractions;
using Velos.Application.Accounts;
using Velos.Application.Common;

namespace Velos.Application.Tests.Accounts;

/// <summary>
/// Contas em memória, com dono. Como a implementação real, conta de outro usuário responde igual
/// a inexistente. Registra o <c>userId</c> de cada chamada para provar que veio do JWT.
/// </summary>
internal sealed class FakeAccountStore : IAccountStore
{
    private readonly Dictionary<Guid, (Guid Owner, AccountSummary Account)> _accounts = [];

    public List<Guid> UserIds { get; } = [];

    public List<string> Calls { get; } = [];

    /// <summary>Quando definido, toda chamada falha com este erro (banco fora do ar).</summary>
    public AppError? Failure { get; set; }

    public AccountDeletionImpact Impact { get; set; } = new(0, 0, 0, []);

    public AccountSummary Add(Guid owner, AccountSummary account)
    {
        _accounts[account.Id] = (owner, account);
        return account;
    }

    public AccountSummary? Find(Guid id) => _accounts.TryGetValue(id, out var entry) ? entry.Account : null;

    public Task<Result<IReadOnlyList<AccountSummary>>> ListAsync(Guid userId, CancellationToken cancellationToken)
    {
        Track(userId, "list");
        if (Failure is not null) return Task.FromResult(Result.Failure<IReadOnlyList<AccountSummary>>(Failure));

        IReadOnlyList<AccountSummary> mine = _accounts.Values.Where(e => e.Owner == userId).Select(e => e.Account).ToList();
        return Task.FromResult(Result.Success(mine));
    }

    public Task<Result<AccountSummary?>> GetAsync(Guid userId, Guid accountId, CancellationToken cancellationToken)
    {
        Track(userId, $"get:{accountId}");
        if (Failure is not null) return Task.FromResult(Result.Failure<AccountSummary?>(Failure));

        return Task.FromResult(Result.Success(Owned(userId, accountId)));
    }

    public Task<Result<Guid>> CreateAsync(Guid userId, NewAccount account, CancellationToken cancellationToken)
    {
        Track(userId, $"create:{account.Name}|{account.Type}|{account.InitialBalanceCents}");
        if (Failure is not null) return Task.FromResult(Result.Failure<Guid>(Failure));

        var created = Add(userId, new AccountSummary(
            Guid.NewGuid(), account.Name, account.Type, account.InitialBalanceCents, account.InitialBalanceCents));
        return Task.FromResult(Result.Success(created.Id));
    }

    public Task<Result<bool>> UpdateAsync(Guid userId, Guid accountId, AccountChanges changes, CancellationToken cancellationToken)
    {
        Track(userId, $"update:{accountId}|{changes.Name}|{changes.InitialBalanceCents}");
        if (Failure is not null) return Task.FromResult(Result.Failure<bool>(Failure));
        if (Owned(userId, accountId) is not { } account) return Task.FromResult(Result.Success(false));

        _accounts[accountId] = (userId, account with { Name = changes.Name, InitialBalanceCents = changes.InitialBalanceCents });
        return Task.FromResult(Result.Success(true));
    }

    public Task<Result<AccountDeletionImpact?>> GetDeletionImpactAsync(Guid userId, Guid accountId, CancellationToken cancellationToken)
    {
        Track(userId, $"impact:{accountId}");
        if (Failure is not null) return Task.FromResult(Result.Failure<AccountDeletionImpact?>(Failure));

        return Task.FromResult(Result.Success(Owned(userId, accountId) is null ? null : Impact));
    }

    public Task<Result<bool>> DeleteAsync(Guid userId, Guid accountId, CancellationToken cancellationToken)
    {
        Track(userId, $"delete:{accountId}");
        if (Failure is not null) return Task.FromResult(Result.Failure<bool>(Failure));

        return Task.FromResult(Result.Success(Owned(userId, accountId) is not null && _accounts.Remove(accountId)));
    }

    private AccountSummary? Owned(Guid userId, Guid accountId) =>
        _accounts.TryGetValue(accountId, out var entry) && entry.Owner == userId ? entry.Account : null;

    private void Track(Guid userId, string call)
    {
        UserIds.Add(userId);
        Calls.Add(call);
    }
}
