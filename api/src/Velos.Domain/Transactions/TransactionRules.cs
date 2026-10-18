using Velos.Domain.Accounts;

namespace Velos.Domain.Transactions;

/// <summary>
/// RN2, RN4, RN5 e RN8 da spec 004. As mesmas regras estão no Zod do front
/// (<c>web/src/lib/validations/transactions.ts</c>) e, as que o banco consegue garantir, nas checks
/// da 0001 (valor &gt; 0, forma da transferência) e da 0011 (descrição).
/// </summary>
public static class TransactionRules
{
    public const int DescriptionMaxLength = 100;

    /// <summary>R$ 999.999.999,99 em centavos: o mesmo teto do saldo da conta.</summary>
    public const long MaxAmountCents = AccountRules.MaxBalanceCents;

    /// <summary>"Hoje" e "mês atual" são sempre de São Paulo, nunca do servidor (que roda em UTC).</summary>
    public static readonly TimeZoneInfo SaoPaulo = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");

    /// <summary>RN2: maior que zero e até o teto. O sentido vem do tipo, nunca do sinal.</summary>
    public static bool IsValidAmount(long amountCents) => amountCents is > 0 and <= MaxAmountCents;

    /// <summary>RN5: opcional; quando vem, até 100 caracteres depois de tirar os espaços das pontas.</summary>
    public static bool IsValidDescription(string? description) =>
        description is null || description.Trim().Length <= DescriptionMaxLength;

    /// <summary>A data de hoje em São Paulo.</summary>
    public static DateOnly Today(TimeProvider time)
    {
        ArgumentNullException.ThrowIfNull(time);
        return DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(time.GetUtcNow(), SaoPaulo).DateTime);
    }

    /// <summary>RN4: nunca no futuro (P1). Lançar algo de amanhã seria recorrência, fora do MVP.</summary>
    public static bool IsValidDate(DateOnly date, DateOnly today) => date <= today;

    /// <summary>
    /// RN8 (P3): na edição o tipo só troca entre despesa e receita. Transferência não vira despesa
    /// nem receita, nem o contrário: para isso, excluir e lançar de novo.
    /// </summary>
    public static bool CanChangeType(TransactionType from, TransactionType to) =>
        from == to || (from != TransactionType.Transfer && to != TransactionType.Transfer);
}
