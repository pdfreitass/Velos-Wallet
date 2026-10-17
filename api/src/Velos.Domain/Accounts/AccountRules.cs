namespace Velos.Domain.Accounts;

/// <summary>
/// RN2 e RN3 da spec 002. As mesmas regras estão nas checks da migration 0009 e no Zod do front
/// (<c>web/src/lib/validations/accounts.ts</c>): se divergirem, um valor passa aqui e é recusado lá.
/// </summary>
public static class AccountRules
{
    public const int NameMaxLength = 40;

    /// <summary>R$ 999.999.999,99 em centavos. Vale para o valor absoluto (também para a dívida).</summary>
    public const long MaxBalanceCents = 99_999_999_999;

    /// <summary>RN2: 1 a 40 caracteres depois de tirar os espaços das pontas.</summary>
    public static bool IsValidName(string? name)
    {
        var trimmed = name?.Trim();
        return !string.IsNullOrEmpty(trimmed) && trimmed.Length <= NameMaxLength;
    }

    /// <summary>
    /// RN3: o saldo inicial chega com sinal. Cartão é sempre dívida (≤ 0), corrente aceita
    /// cheque especial (qualquer sinal), poupança e dinheiro só zero ou positivo.
    /// </summary>
    public static bool IsValidInitialBalance(AccountType type, long initialBalanceCents)
    {
        if (initialBalanceCents is > MaxBalanceCents or < -MaxBalanceCents) return false;

        return type switch
        {
            AccountType.CreditCard => initialBalanceCents <= 0,
            AccountType.Checking => true,
            AccountType.Savings or AccountType.Cash => initialBalanceCents >= 0,
            _ => false,
        };
    }
}
