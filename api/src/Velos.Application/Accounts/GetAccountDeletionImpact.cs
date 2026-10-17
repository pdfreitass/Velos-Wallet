using Velos.Application.Abstractions;
using Velos.Application.Common;

namespace Velos.Application.Accounts;

/// <summary>RN6: números e contas afetadas para o diálogo de exclusão.</summary>
public sealed class GetAccountDeletionImpactHandler(IUserContext user, IAccountStore accounts)
{
    public async Task<Result<AccountDeletionImpact>> HandleAsync(Guid accountId, CancellationToken cancellationToken)
    {
        var impact = await accounts.GetDeletionImpactAsync(user.UserId, accountId, cancellationToken);
        if (!impact.IsSuccess) return Result.Failure<AccountDeletionImpact>(impact.Error!);

        return impact.Value is { } value
            ? Result.Success(value)
            : Result.Failure<AccountDeletionImpact>(AccountErrors.NotFound);
    }
}
