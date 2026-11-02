using Velos.Application.Abstractions;
using Velos.Application.Common;

namespace Velos.Application.Accounts;

/// <summary>Apaga a conta e as movimentações dela, sem arquivar (P2 / RN6, ADR 0017).</summary>
public sealed class DeleteAccountHandler(IUserContext user, IAccountStore accounts)
{
    public async Task<Result<Unit>> HandleAsync(Guid accountId, CancellationToken cancellationToken)
    {
        var deleted = await accounts.DeleteAsync(user.UserId, accountId, cancellationToken);
        if (!deleted.IsSuccess) return Result.Failure<Unit>(deleted.Error!);

        return deleted.Value ? Result.Ok() : Result.Failure<Unit>(AccountErrors.NotFound);
    }
}
