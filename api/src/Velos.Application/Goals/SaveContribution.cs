using FluentValidation;
using Velos.Application.Abstractions;
using Velos.Application.Common;

namespace Velos.Application.Goals;

/// <summary>Aporte (RN3): não mexe em nenhum saldo. A meta vem da rota e tem de ser do usuário do JWT.</summary>
public sealed record SaveContributionCommand(long AmountCents, DateOnly? Date)
{
    internal ContributionInput ToInput() => new(AmountCents, Date);

    internal ContributionData ToData() => new(AmountCents, Date!.Value);
}

public sealed class AddContributionHandler(IValidator<ContributionInput> validator, IUserContext user, IGoalStore goals)
{
    public async Task<Result<Guid>> HandleAsync(Guid goalId, SaveContributionCommand command, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);

        var validation = await validator.ValidateAsync(command.ToInput(), cancellationToken);
        if (!validation.IsValid) return Result.Failure<Guid>(ValidationErrors.From(validation));

        var added = await goals.AddContributionAsync(user.UserId, goalId, command.ToData(), cancellationToken);
        if (!added.IsSuccess) return Result.Failure<Guid>(added.Error!);

        return added.Value is { } id ? Result.Success(id) : Result.Failure<Guid>(GoalErrors.NotFound);
    }
}

public sealed class UpdateContributionHandler(IValidator<ContributionInput> validator, IUserContext user, IGoalStore goals)
{
    public async Task<Result<Unit>> HandleAsync(
        Guid goalId, Guid contributionId, SaveContributionCommand command, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);

        var validation = await validator.ValidateAsync(command.ToInput(), cancellationToken);
        if (!validation.IsValid) return Result.Failure<Unit>(ValidationErrors.From(validation));

        var updated = await goals.UpdateContributionAsync(user.UserId, goalId, contributionId, command.ToData(), cancellationToken);
        if (!updated.IsSuccess) return Result.Failure<Unit>(updated.Error!);

        return updated.Value ? Result.Ok() : Result.Failure<Unit>(GoalErrors.ContributionNotFound);
    }
}

public sealed class DeleteContributionHandler(IUserContext user, IGoalStore goals)
{
    public async Task<Result<Unit>> HandleAsync(Guid goalId, Guid contributionId, CancellationToken cancellationToken)
    {
        var deleted = await goals.DeleteContributionAsync(user.UserId, goalId, contributionId, cancellationToken);
        if (!deleted.IsSuccess) return Result.Failure<Unit>(deleted.Error!);

        return deleted.Value ? Result.Ok() : Result.Failure<Unit>(GoalErrors.ContributionNotFound);
    }
}
