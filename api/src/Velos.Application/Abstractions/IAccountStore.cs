using Velos.Application.Accounts;
using Velos.Application.Common;

namespace Velos.Application.Abstractions;

/// <summary>
/// Contas do usuário no banco (spec 002). O <c>userId</c> vem SEMPRE do <see cref="IUserContext"/>,
/// passado pelo handler; a implementação filtra por ele além da RLS. Conta de outra pessoa e conta
/// inexistente têm a mesma resposta (<c>null</c> / <c>false</c>), para não revelar se o id existe.
/// </summary>
public interface IAccountStore
{
    Task<Result<IReadOnlyList<AccountSummary>>> ListAsync(Guid userId, CancellationToken cancellationToken);

    Task<Result<AccountSummary?>> GetAsync(Guid userId, Guid accountId, CancellationToken cancellationToken);

    Task<Result<Guid>> CreateAsync(Guid userId, NewAccount account, CancellationToken cancellationToken);

    /// <returns><c>false</c> se a conta não existe para este usuário.</returns>
    Task<Result<bool>> UpdateAsync(Guid userId, Guid accountId, AccountChanges changes, CancellationToken cancellationToken);

    /// <summary>RN6: conta os dois lados das transferências (<c>account_id</c> e <c>transfer_account_id</c>).</summary>
    Task<Result<AccountDeletionImpact?>> GetDeletionImpactAsync(Guid userId, Guid accountId, CancellationToken cancellationToken);

    /// <summary>O banco apaga as movimentações em cascata (P2).</summary>
    /// <returns><c>false</c> se a conta não existe para este usuário.</returns>
    Task<Result<bool>> DeleteAsync(Guid userId, Guid accountId, CancellationToken cancellationToken);
}
