using FluentValidation;
using Velos.Application.Abstractions;
using Velos.Application.Common;

namespace Velos.Application.Goals;

/// <summary>Valor-alvo em centavos (RN1); prazo opcional. Não há campo de usuário: o dono é o do JWT.</summary>
public sealed record SaveGoalCommand(string? Name, long TargetCents, DateOnly? Deadline)
{
    internal GoalInput ToInput(DateOnly? currentDeadline = null) => new(Name, TargetCents, Deadline, currentDeadline);

    internal GoalData ToData() => new(Name!.Trim(), TargetCents, Deadline);
}

public sealed class CreateGoalHandler(IValidator<GoalInput> validator, IUserContext user, IGoalStore goals)
{
    public async Task<Result<Guid>> HandleAsync(SaveGoalCommand command, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);

        var validation = await validator.ValidateAsync(command.ToInput(), cancellationToken);
        if (!validation.IsValid) return Result.Failure<Guid>(ValidationErrors.From(validation));

        return await goals.CreateAsync(user.UserId, command.ToData(), cancellationToken);
    }
}

/// <summary>RN2: um prazo que já venceu pode ser mantido, mas não trocado por outra data no passado.</summary>
public sealed class UpdateGoalHandler(IValidator<GoalInput> validator, IUserContext user, IGoalStore goals)
{
    public async Task<Result<Unit>> HandleAsync(Guid goalId, SaveGoalCommand command, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        var userId = user.UserId;

        var found = await goals.GetAsync(userId, goalId, cancellationToken);
        if (!found.IsSuccess) return Result.Failure<Unit>(found.Error!);
        if (found.Value is not { } current) return Result.Failure<Unit>(GoalErrors.NotFound);

        var validation = await validator.ValidateAsync(command.ToInput(current.Deadline), cancellationToken);
        if (!validation.IsValid) return Result.Failure<Unit>(ValidationErrors.From(validation));

        var updated = await goals.UpdateAsync(userId, goalId, command.ToData(), cancellationToken);
        if (!updated.IsSuccess) return Result.Failure<Unit>(updated.Error!);

        // Sumiu entre a leitura e a gravação (excluída em outra aba).
        return updated.Value ? Result.Ok() : Result.Failure<Unit>(GoalErrors.NotFound);
    }
}

/// <summary>RN7: os aportes vão junto. Sem desfazer.</summary>
public sealed class DeleteGoalHandler(IUserContext user, IGoalStore goals)
{
    public async Task<Result<Unit>> HandleAsync(Guid goalId, CancellationToken cancellationToken)
    {
        var deleted = await goals.DeleteAsync(user.UserId, goalId, cancellationToken);
        if (!deleted.IsSuccess) return Result.Failure<Unit>(deleted.Error!);

        return deleted.Value ? Result.Ok() : Result.Failure<Unit>(GoalErrors.NotFound);
    }
}
