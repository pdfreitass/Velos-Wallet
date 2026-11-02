using Velos.Application.Common;
using Velos.Application.Transactions;

namespace Velos.Application.Abstractions;

/// <summary>
/// Transações do usuário no banco (spec 004). O <c>userId</c> vem SEMPRE do <see cref="IUserContext"/>,
/// passado pelo handler; a implementação filtra por ele além da RLS. Transação de outra pessoa e
/// transação inexistente têm a mesma resposta (<c>null</c> / <c>false</c>).
/// </summary>
public interface ITransactionStore
{
    /// <summary>Linhas do mês (com o filtro), ordenadas por data e criação, da mais nova para a mais antiga.</summary>
    Task<Result<IReadOnlyList<TransactionListItem>>> ListMonthAsync(
        Guid userId, DateOnly monthStart, Guid? categoryId, CancellationToken cancellationToken);

    /// <summary>Totais do mês inteiro, da view <c>monthly_summary</c> (zero quando não há transações).</summary>
    Task<Result<MonthTotals>> GetMonthTotalsAsync(Guid userId, DateOnly monthStart, CancellationToken cancellationToken);

    Task<Result<TransactionDetail?>> GetAsync(Guid userId, Guid transactionId, CancellationToken cancellationToken);

    /// <summary>RN10: procura a conta, a conta de destino e a categoria só entre as do usuário.</summary>
    Task<Result<TransactionReferences>> GetReferencesAsync(
        Guid userId, Guid accountId, Guid? transferAccountId, Guid? categoryId, CancellationToken cancellationToken);

    Task<Result<Guid>> CreateAsync(Guid userId, TransactionData data, CancellationToken cancellationToken);

    /// <returns><c>false</c> se a transação não existe para este usuário.</returns>
    Task<Result<bool>> UpdateAsync(Guid userId, Guid transactionId, TransactionData data, CancellationToken cancellationToken);

    /// <returns><c>false</c> se a transação não existe para este usuário.</returns>
    Task<Result<bool>> DeleteAsync(Guid userId, Guid transactionId, CancellationToken cancellationToken);
}
