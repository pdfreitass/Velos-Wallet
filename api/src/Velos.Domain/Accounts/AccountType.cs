namespace Velos.Domain.Accounts;

/// <summary>RN1 da spec 002. Espelha o enum <c>account_type</c> do banco. Não muda depois de criada.</summary>
public enum AccountType
{
    Checking,
    Savings,
    Cash,
    CreditCard,
}
