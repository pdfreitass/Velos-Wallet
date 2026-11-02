using Velos.Application.Common;
using Velos.Application.Goals;
using Velos.Domain.Goals;

namespace Velos.Application.Tests.Goals;

/// <summary>Metas: RN1, RN2, RN5, RN6, CA2, CA6 e CA-seg da spec 006.</summary>
public class GoalHandlerTests
{
    private static readonly Guid Me = FakeUserContext.DefaultUserId;
    private static readonly Guid OtherUser = Guid.Parse("99999999-9999-9999-9999-999999999999");

    // 17/10/2026 às 23:30 em São Paulo (02:30 UTC do dia 18): "hoje" ainda é dia 17.
    private static readonly FixedTimeProvider Time = new(new DateTimeOffset(2026, 10, 18, 2, 30, 0, TimeSpan.Zero));
    private static readonly DateOnly Today = new(2026, 10, 17);

    private readonly FakeUserContext _user = new();
    private readonly FakeGoalStore _store = new();

    private static GoalInputValidator Validator => new(Time);

    private CreateGoalHandler Create => new(Validator, _user, _store);

    private UpdateGoalHandler Update => new(Validator, _user, _store);

    private static SaveGoalCommand Goal(string? name = "Viagem para o Chile", long target = 800_000, DateOnly? deadline = null) =>
        new(name, target, deadline);

    [Fact]
    public async Task Goal_is_saved_with_the_user_from_the_jwt_and_a_trimmed_name()
    {
        var result = await Create.HandleAsync(Goal("  Viagem para o Chile ", deadline: new DateOnly(2027, 6, 30)), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(new GoalData("Viagem para o Chile", 800_000, new DateOnly(2027, 6, 30)), _store.LastSavedGoal);
        Assert.All(_store.UserIds, id => Assert.Equal(Me, id));
    }

    [Theory]
    [InlineData("   ", 800_000, "name", "Informe o nome da meta")]
    [InlineData(null, 800_000, "name", "Informe o nome da meta")]
    [InlineData("Viagem", 0, "targetCents", "Informe um valor maior que zero")]
    [InlineData("Viagem", 100_000_000_000, "targetCents", "O valor máximo é R$ 999.999.999,99")]
    public async Task Ca6_invalid_goal_is_refused_by_the_api(string? name, long target, string field, string message)
    {
        var result = await Create.HandleAsync(Goal(name, target), default);

        AssertFieldError(result.Error, field, message);
        Assert.Null(_store.LastSavedGoal);
    }

    [Fact]
    public async Task Name_above_60_characters_is_refused()
    {
        var result = await Create.HandleAsync(Goal(new string('a', 61)), default);

        AssertFieldError(result.Error, "name", "O nome pode ter no máximo 60 caracteres");
    }

    [Fact]
    public async Task Ca6_deadline_in_the_past_is_refused_on_create_but_today_in_sao_paulo_is_accepted()
    {
        var past = await Create.HandleAsync(Goal(deadline: Today.AddDays(-1)), default);
        var today = await Create.HandleAsync(Goal(deadline: Today), default);

        AssertFieldError(past.Error, "deadline", "O prazo não pode ser no passado");
        Assert.True(today.IsSuccess);
    }

    [Fact]
    public async Task Deadline_after_2100_is_refused()
    {
        var result = await Create.HandleAsync(Goal(deadline: new DateOnly(9999, 12, 31)), default);

        AssertFieldError(result.Error, "deadline", "Informe um prazo até 2100");
    }

    [Fact]
    public async Task Rn2_editing_keeps_an_expired_deadline_but_refuses_another_past_date()
    {
        var expired = new DateOnly(2026, 9, 30);
        var goal = _store.AddGoal(Me, deadline: expired);

        var kept = await Update.HandleAsync(goal.Id, Goal("Novo nome", deadline: expired), default);
        var moved = await Update.HandleAsync(goal.Id, Goal(deadline: new DateOnly(2026, 9, 29)), default);

        Assert.True(kept.IsSuccess);
        AssertFieldError(moved.Error, "deadline", "O prazo não pode ser no passado");
    }

    [Fact]
    public async Task Goal_of_another_user_is_not_found_for_read_update_and_delete()
    {
        var theirs = _store.AddGoal(OtherUser);

        var read = await new GetGoalHandler(_user, _store, Time).HandleAsync(theirs.Id, default);
        var updated = await Update.HandleAsync(theirs.Id, Goal(), default);
        var deleted = await new DeleteGoalHandler(_user, _store).HandleAsync(theirs.Id, default);

        Assert.Equal(GoalErrors.NotFound, read.Error);
        Assert.Equal(GoalErrors.NotFound, updated.Error);
        Assert.Equal(GoalErrors.NotFound, deleted.Error);
        Assert.True(_store.HasGoal(theirs.Id));
        Assert.All(_store.UserIds, id => Assert.Equal(Me, id));
    }

    [Fact]
    public async Task Ca2_list_brings_status_and_monthly_pace_of_today_in_sao_paulo()
    {
        _store.AddGoal(Me, targetCents: 800_000, deadline: new DateOnly(2027, 6, 1), currentCents: 200_000);

        var result = await new ListGoalsHandler(_user, _store, Time).HandleAsync(default);

        var goal = Assert.Single(result.Value);
        Assert.Equal(GoalStatus.InProgress, goal.Status);
        Assert.Equal(600_000, goal.RemainingCents);
        Assert.Equal(66_667, goal.MonthlyPaceCents);
        Assert.False(goal.DeadlinePassed);
    }

    [Fact]
    public async Task Expired_deadline_without_reaching_has_no_pace_and_is_flagged()
    {
        var goal = _store.AddGoal(Me, deadline: new DateOnly(2026, 9, 30), currentCents: 100);

        var result = await new GetGoalHandler(_user, _store, Time).HandleAsync(goal.Id, default);

        Assert.Null(result.Value.Goal.MonthlyPaceCents);
        Assert.True(result.Value.Goal.DeadlinePassed);
    }

    [Fact]
    public async Task Reached_goal_is_not_flagged_as_expired()
    {
        var goal = _store.AddGoal(Me, targetCents: 1_000, deadline: new DateOnly(2026, 9, 30), currentCents: 1_500);

        var result = await new GetGoalHandler(_user, _store, Time).HandleAsync(goal.Id, default);

        Assert.Equal(GoalStatus.Reached, result.Value.Goal.Status);
        Assert.Equal(500, result.Value.Goal.ExcessCents);
        Assert.False(result.Value.Goal.DeadlinePassed);
    }

    [Fact]
    public async Task Database_failure_is_passed_through()
    {
        _store.Failure = CommonErrors.DatabaseUnavailable;

        var result = await new ListGoalsHandler(_user, _store, Time).HandleAsync(default);

        Assert.Equal(CommonErrors.DatabaseUnavailable, result.Error);
    }

    internal static void AssertFieldError(AppError? error, string field, string message)
    {
        Assert.NotNull(error);
        Assert.Equal(ErrorKind.Validation, error.Kind);
        var fields = Assert.IsType<Dictionary<string, string[]>>(error.Details!["errors"]);
        Assert.Contains(message, fields[field]);
    }
}
