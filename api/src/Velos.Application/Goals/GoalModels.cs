using Velos.Domain.Goals;

namespace Velos.Application.Goals;

/// <summary>
/// Uma linha da view <c>goal_progress</c>: o juntado, a contagem, a falta e o excedente já vêm
/// somados do banco (ADR 0006).
/// </summary>
public sealed record GoalProgress(
    Guid Id,
    string Name,
    long TargetCents,
    DateOnly? Deadline,
    long CurrentCents,
    int ContributionCount,
    long RemainingCents,
    long ExcessCents);

/// <summary>
/// A meta como a tela mostra: o progresso do banco mais o estado (RN5) e o ritmo (RN6), que
/// dependem do "hoje" de São Paulo. <see cref="MonthlyPaceCents"/> é <c>null</c> quando não há ritmo.
/// </summary>
public sealed record GoalSummary(
    Guid Id,
    string Name,
    long TargetCents,
    DateOnly? Deadline,
    long CurrentCents,
    int ContributionCount,
    long RemainingCents,
    long ExcessCents,
    GoalStatus Status,
    long? MonthlyPaceCents,
    bool DeadlinePassed)
{
    public static GoalSummary From(GoalProgress goal, DateOnly today)
    {
        ArgumentNullException.ThrowIfNull(goal);
        var status = GoalRules.Status(goal.CurrentCents, goal.TargetCents);
        return new GoalSummary(
            goal.Id,
            goal.Name,
            goal.TargetCents,
            goal.Deadline,
            goal.CurrentCents,
            goal.ContributionCount,
            goal.RemainingCents,
            goal.ExcessCents,
            status,
            GoalRules.MonthlyPace(goal.RemainingCents, goal.Deadline, today),
            status != GoalStatus.Reached && GoalRules.IsDeadlinePassed(goal.Deadline, today));
    }
}

/// <summary>Um aporte na lista do detalhe.</summary>
public sealed record Contribution(Guid Id, long AmountCents, DateOnly Date);

/// <summary>O detalhe da meta: o resumo e os aportes, do mais recente para o mais antigo.</summary>
public sealed record GoalDetail(GoalSummary Goal, IReadOnlyList<Contribution> Contributions);

/// <summary>Meta já validada, com o nome sem os espaços das pontas. Vale para criar e para editar.</summary>
public sealed record GoalData(string Name, long TargetCents, DateOnly? Deadline);

/// <summary>Aporte já validado. A data vem SEMPRE da API: o default da coluna é <c>current_date</c> em UTC.</summary>
public sealed record ContributionData(long AmountCents, DateOnly Date);
