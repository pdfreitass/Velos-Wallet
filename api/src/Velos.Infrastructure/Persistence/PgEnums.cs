using System.Globalization;
using Velos.Domain.Accounts;
using Velos.Domain.Categories;

namespace Velos.Infrastructure.Persistence;

/// <summary>
/// Valores dos enums do banco (<c>account_type</c> e <c>transaction_type</c>, migration 0001).
/// No SQL: escrever com <c>{valor}::public.account_type</c> e ler com <c>type::text</c>.
/// </summary>
internal static class PgEnums
{
    public static string ToDb(AccountType type) => type switch
    {
        AccountType.Checking => "checking",
        AccountType.Savings => "savings",
        AccountType.Cash => "cash",
        AccountType.CreditCard => "credit_card",
        _ => throw new ArgumentOutOfRangeException(nameof(type), type, null),
    };

    public static AccountType ToAccountType(string value) => value switch
    {
        "checking" => AccountType.Checking,
        "savings" => AccountType.Savings,
        "cash" => AccountType.Cash,
        "credit_card" => AccountType.CreditCard,
        _ => throw new InvalidOperationException($"account_type desconhecido: {value}"),
    };

    public static string ToDb(CategoryType type) => type switch
    {
        CategoryType.Expense => "expense",
        CategoryType.Income => "income",
        _ => throw new ArgumentOutOfRangeException(nameof(type), type, null),
    };

    public static CategoryType ToCategoryType(string value) => value switch
    {
        "expense" => CategoryType.Expense,
        "income" => CategoryType.Income,
        _ => throw new InvalidOperationException($"tipo de categoria desconhecido: {value}"),
    };

    /// <summary>Ordem de nomes em português ("Água" junto do "A", sem diferenciar maiúsculas).</summary>
    public static readonly StringComparer PtBr = StringComparer.Create(CultureInfo.GetCultureInfo("pt-BR"), ignoreCase: true);
}
