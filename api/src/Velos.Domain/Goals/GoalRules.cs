using Velos.Domain.Transactions;

namespace Velos.Domain.Goals;

/// <summary>
/// RN1–RN3, RN5 e RN6 da spec 006. As mesmas regras estão no Zod do front
/// (<c>web/src/lib/validations/goals.ts</c>) e, as que o banco garante, nas checks da 0001
/// (alvo e aporte &gt; 0) e da 0013 (nome). O juntado, a falta e o excedente vêm somados da view
/// <c>goal_progress</c> (ADR 0006); aqui só há contas de saída sobre esses números.
/// </summary>
public static class GoalRules
{
    public const int NameMaxLength = 60;

    /// <summary>O mesmo teto das transações (R$ 999.999.999,99).</summary>
    public const long MaxAmountCents = TransactionRules.MaxAmountCents;

    /// <summary>RN1: 1 a 60 caracteres depois de tirar os espaços das pontas.</summary>
    public static bool IsValidName(string? name)
    {
        var trimmed = name?.Trim();
        return !string.IsNullOrEmpty(trimmed) && trimmed.Length <= NameMaxLength;
    }

    /// <summary>RN1 e RN3: alvo e aporte maiores que zero e até o teto.</summary>
    public static bool IsValidAmount(long amountCents) => amountCents is > 0 and <= MaxAmountCents;

    /// <summary>
    /// RN2: opcional. Não pode estar no passado (hoje é aceito), a não ser que seja o prazo que
    /// a meta já tinha: editar o nome de uma meta vencida não obriga a trocar o prazo.
    /// </summary>
    /// <param name="currentDeadline">O prazo gravado (na criação, <c>null</c>).</param>
    public static bool IsValidDeadline(DateOnly? deadline, DateOnly today, DateOnly? currentDeadline = null) =>
        deadline is not { } value || value == currentDeadline || (value >= today && value <= MaxDeadline);

    /// <summary>O mesmo fim de faixa do <c>MonthKey</c>: sem ele, 31/12/9999 viraria "Guarde R$ 0,01 por mês".</summary>
    public static readonly DateOnly MaxDeadline = new(2100, 12, 31);

    /// <summary>RN3: a mesma faixa das transações (de 2000 até hoje, nunca no futuro).</summary>
    public static bool IsValidContributionDate(DateOnly date, DateOnly today) => TransactionRules.IsValidDate(date, today);

    /// <summary>RN5.</summary>
    public static GoalStatus Status(long currentCents, long targetCents) =>
        currentCents >= targetCents ? GoalStatus.Reached
        : currentCents > 0 ? GoalStatus.InProgress
        : GoalStatus.NotStarted;

    /// <summary>RN6: o prazo é um dia; vencido é só a partir do dia seguinte.</summary>
    public static bool IsDeadlinePassed(DateOnly? deadline, DateOnly today) => deadline is { } value && value < today;

    /// <summary>
    /// RN6: quanto guardar por mês até o prazo, contando o mês atual e arredondando para cima, em
    /// centavos e só com inteiros. <c>null</c> sem prazo, com a meta atingida ou com o prazo vencido.
    /// </summary>
    public static long? MonthlyPace(long remainingCents, DateOnly? deadline, DateOnly today)
    {
        if (remainingCents <= 0 || deadline is not { } value || value < today) return null;

        var months = ((value.Year - today.Year) * 12) + (value.Month - today.Month) + 1;
        return (remainingCents + months - 1) / months;
    }
}
