using Velos.Application.Abstractions;
using Velos.Application.Common;

namespace Velos.Application.Accounts;

public sealed class GetAccountHandler(IUserContext user, IAccountStore accounts)
{
    public async Task<Result<AccountSummary>> HandleAsync(Guid accountId, CancellationToken cancellationToken)
    {
        var found = await accounts.GetAsync(user.UserId, accountId, cancellationToken);
        if (!found.IsSuccess) return Result.Failure<AccountSummary>(found.Error!);

        return found.Value is { } account
            ? Result.Success(account)
            : Result.Failure<AccountSummary>(AccountErrors.NotFound);
    }
}
