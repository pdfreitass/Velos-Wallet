namespace Velos.Domain.Transactions;

/// <summary>RN1 da spec 004. No banco é o enum <c>transaction_type</c> (migration 0001).</summary>
public enum TransactionType
{
    Expense,
    Income,
    Transfer,
}
