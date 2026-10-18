using Velos.Application.Abstractions;
using Velos.Application.Common;
using Velos.Domain.Transactions;

namespace Velos.Application.Goals;

/// <summary>A lista de metas (RN8, já ordenada pelo banco) com o estado e o ritmo de hoje em São Paulo.</summary>
public sealed class ListGoalsHandler(IUserContext user, IGoalStore goals, TimeProvider time)
{
    public async Task<Result<IReadOnlyList<GoalSummary>>> HandleAsync(CancellationToken cancellationToken)
    {
        var found = await goals.ListAsync(user.UserId, cancellationToken);
        if (!found.IsSuccess) return Result.Failure<IReadOnlyList<GoalSummary>>(found.Error!);

        var today = TransactionRules.Today(time);
        return Result.Success<IReadOnlyList<GoalSummary>>(found.Value.Select(goal => GoalSummary.From(goal, today)).ToList());
    }
}

/// <summary>O detalhe: o resumo e os aportes. Meta de outra pessoa = inexistente (404).</summary>
public sealed class GetGoalHandler(IUserContext user, IGoalStore goals, TimeProvider time)
{
    public async Task<Result<GoalDetail>> HandleAsync(Guid goalId, CancellationToken cancellationToken)
    {
        var userId = user.UserId;
        var found = await goals.GetAsync(userId, goalId, cancellationToken);
        if (!found.IsSuccess) return Result.Failure<GoalDetail>(found.Error!);
        if (found.Value is not { } goal) return Result.Failure<GoalDetail>(GoalErrors.NotFound);

        var contributions = await goals.ListContributionsAsync(userId, goalId, cancellationToken);
        if (!contributions.IsSuccess) return Result.Failure<GoalDetail>(contributions.Error!);

        return Result.Success(new GoalDetail(GoalSummary.From(goal, TransactionRules.Today(time)), contributions.Value));
    }
}
