using Velos.Application.Abstractions;
using Velos.Application.Common;
using Velos.Application.Goals;

namespace Velos.Application.Tests.Goals;

/// <summary>
/// Metas e aportes em memória, com dono. Como a implementação real, o que é de outro usuário responde
/// igual a inexistente. Registra o <c>userId</c> de cada chamada.
/// </summary>
internal sealed class FakeGoalStore : IGoalStore
{
    private readonly Dictionary<Guid, (Guid Owner, GoalProgress Goal)> _goals = [];
    private readonly Dictionary<Guid, (Guid Owner, Guid GoalId, Contribution Contribution)> _contributions = [];

    public List<Guid> UserIds { get; } = [];

    /// <summary>Quando definido, toda chamada falha com este erro (banco fora do ar).</summary>
    public AppError? Failure { get; set; }

    public GoalData? LastSavedGoal { get; private set; }

    public ContributionData? LastSavedContribution { get; private set; }

    public GoalProgress AddGoal(Guid owner, long targetCents = 800_000, DateOnly? deadline = null, long currentCents = 0)
    {
        var goal = new GoalProgress(
            Guid.NewGuid(), "Viagem", targetCents, deadline, currentCents, currentCents > 0 ? 1 : 0,
            Math.Max(targetCents - currentCents, 0), Math.Max(currentCents - targetCents, 0));
        _goals[goal.Id] = (owner, goal);
        return goal;
    }

    public Contribution AddContribution(Guid owner, Guid goalId, long amountCents = 50_000)
    {
        var contribution = new Contribution(Guid.NewGuid(), amountCents, new DateOnly(2026, 10, 1));
        _contributions[contribution.Id] = (owner, goalId, contribution);
        return contribution;
    }

    public bool HasGoal(Guid id) => _goals.ContainsKey(id);

    public bool HasContribution(Guid id) => _contributions.ContainsKey(id);

    public Task<Result<IReadOnlyList<GoalProgress>>> ListAsync(Guid userId, CancellationToken cancellationToken) =>
        Run<IReadOnlyList<GoalProgress>>(userId, () => _goals.Values.Where(e => e.Owner == userId).Select(e => e.Goal).ToList());

    public Task<Result<GoalProgress?>> GetAsync(Guid userId, Guid goalId, CancellationToken cancellationToken) =>
        Run(userId, () => FindGoal(userId, goalId));

    public Task<Result<IReadOnlyList<Contribution>>> ListContributionsAsync(Guid userId, Guid goalId, CancellationToken cancellationToken) =>
        Run<IReadOnlyList<Contribution>>(userId, () => _contributions.Values
            .Where(e => e.Owner == userId && e.GoalId == goalId).Select(e => e.Contribution).ToList());

    public Task<Result<Guid>> CreateAsync(Guid userId, GoalData data, CancellationToken cancellationToken) =>
        Run(userId, () =>
        {
            LastSavedGoal = data;
            return AddGoal(userId, data.TargetCents, data.Deadline).Id;
        });

    public Task<Result<bool>> UpdateAsync(Guid userId, Guid goalId, GoalData data, CancellationToken cancellationToken) =>
        Run(userId, () =>
        {
            if (FindGoal(userId, goalId) is null) return false;
            LastSavedGoal = data;
            return true;
        });

    public Task<Result<bool>> DeleteAsync(Guid userId, Guid goalId, CancellationToken cancellationToken) =>
        Run(userId, () => FindGoal(userId, goalId) is not null && _goals.Remove(goalId));

    public Task<Result<Guid?>> AddContributionAsync(Guid userId, Guid goalId, ContributionData data, CancellationToken cancellationToken) =>
        Run<Guid?>(userId, () =>
        {
            if (FindGoal(userId, goalId) is null) return null;
            LastSavedContribution = data;
            return AddContribution(userId, goalId, data.AmountCents).Id;
        });

    public Task<Result<bool>> UpdateContributionAsync(
        Guid userId, Guid goalId, Guid contributionId, ContributionData data, CancellationToken cancellationToken) =>
        Run(userId, () =>
        {
            if (!OwnsContribution(userId, goalId, contributionId)) return false;
            LastSavedContribution = data;
            return true;
        });

    public Task<Result<bool>> DeleteContributionAsync(Guid userId, Guid goalId, Guid contributionId, CancellationToken cancellationToken) =>
        Run(userId, () => OwnsContribution(userId, goalId, contributionId) && _contributions.Remove(contributionId));

    private GoalProgress? FindGoal(Guid userId, Guid goalId) =>
        _goals.TryGetValue(goalId, out var entry) && entry.Owner == userId ? entry.Goal : null;

    private bool OwnsContribution(Guid userId, Guid goalId, Guid contributionId) =>
        _contributions.TryGetValue(contributionId, out var entry) && entry.Owner == userId && entry.GoalId == goalId;

    private Task<Result<T>> Run<T>(Guid userId, Func<T> action)
    {
        UserIds.Add(userId);
        return Task.FromResult(Failure is null ? Result.Success(action()) : Result.Failure<T>(Failure));
    }
}
