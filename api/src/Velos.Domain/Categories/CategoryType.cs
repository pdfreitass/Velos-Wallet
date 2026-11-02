namespace Velos.Domain.Categories;

/// <summary>
/// RN8 da spec 002. No banco é o enum <c>transaction_type</c>, mas categoria só aceita estes dois
/// (transferência não tem categoria). Não muda depois de criada.
/// </summary>
public enum CategoryType
{
    Expense,
    Income,
}
