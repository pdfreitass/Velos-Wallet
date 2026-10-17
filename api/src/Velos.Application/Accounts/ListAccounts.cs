using Velos.Application.Abstractions;
using Velos.Application.Common;

namespace Velos.Application.Accounts;

/// <summary>Contas do usuário com o saldo atual (soma no SQL, view account_balances).</summary>
public sealed class ListAccountsHandler(IUserContext user, IAccountStore accounts)
{
    public Task<Result<IReadOnlyList<AccountSummary>>> HandleAsync(CancellationToken cancellationToken) =>
        accounts.ListAsync(user.UserId, cancellationToken);
}
