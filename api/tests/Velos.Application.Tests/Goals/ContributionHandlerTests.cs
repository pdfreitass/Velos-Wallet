using Velos.Application.Goals;

namespace Velos.Application.Tests.Goals;

/// <summary>Aportes: RN3, CA4, CA6 e CA-seg da spec 006.</summary>
public class ContributionHandlerTests
{
    private static readonly Guid Me = FakeUserContext.DefaultUserId;
    private static readonly Guid OtherUser = Guid.Parse("99999999-9999-9999-9999-999999999999");

    private static readonly FixedTimeProvider Time = new(new DateTimeOffset(2026, 10, 18, 2, 30, 0, TimeSpan.Zero));
    private static readonly DateOnly Today = new(2026, 10, 17);

    private readonly FakeUserContext _user = new();
    private readonly FakeGoalStore _store = new();

    private static ContributionInputValidator Validator => new(Time);

    private AddContributionHandler Add => new(Validator, _user, _store);

    private UpdateContributionHandler Update => new(Validator, _user, _store);

    private DeleteContributionHandler Delete => new(_user, _store);

    [Fact]
    public async Task Contribution_is_added_to_my_goal_with_the_date_sent()
    {
        var goal = _store.AddGoal(Me);

        var result = await Add.HandleAsync(goal.Id, new SaveContributionCommand(50_000, Today), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(new ContributionData(50_000, Today), _store.LastSavedContribution);
        Assert.All(_store.UserIds, id => Assert.Equal(Me, id));
    }

    [Theory]
    [InlineData(0, "2026-10-17", "amountCents", "Informe um valor maior que zero")]
    [InlineData(100_000_000_000, "2026-10-17", "amountCents", "O valor máximo é R$ 999.999.999,99")]
    [InlineData(100, "2026-10-18", "date", "A data não pode ser no futuro")]   // amanhã em São Paulo
    [InlineData(100, "1999-12-31", "date", "Informe uma data a partir de 2000")]
    public async Task Ca6_invalid_contribution_is_refused(long amount, string date, string field, string message)
    {
        var goal = _store.AddGoal(Me);
        var command = new SaveContributionCommand(amount, DateOnly.Parse(date, System.Globalization.CultureInfo.InvariantCulture));

        var result = await Add.HandleAsync(goal.Id, command, default);

        GoalHandlerTests.AssertFieldError(result.Error, field, message);
        Assert.Null(_store.LastSavedContribution);
    }

    [Fact]
    public async Task Missing_date_is_refused_instead_of_using_the_utc_default_of_the_column()
    {
        var goal = _store.AddGoal(Me);

        var result = await Add.HandleAsync(goal.Id, new SaveContributionCommand(100, null), default);

        GoalHandlerTests.AssertFieldError(result.Error, "date", "Informe a data");
    }

    [Fact]
    public async Task Contribution_to_a_goal_of_another_user_is_not_found()
    {
        var theirs = _store.AddGoal(OtherUser);

        var result = await Add.HandleAsync(theirs.Id, new SaveContributionCommand(100, Today), default);

        Assert.Equal(GoalErrors.NotFound, result.Error);
        Assert.Null(_store.LastSavedContribution);
    }

    [Fact]
    public async Task Ca4_contribution_is_updated_and_deleted_inside_its_goal()
    {
        var goal = _store.AddGoal(Me);
        var contribution = _store.AddContribution(Me, goal.Id);

        var updated = await Update.HandleAsync(goal.Id, contribution.Id, new SaveContributionCommand(70_000, Today), default);
        var deleted = await Delete.HandleAsync(goal.Id, contribution.Id, default);

        Assert.True(updated.IsSuccess);
        Assert.Equal(new ContributionData(70_000, Today), _store.LastSavedContribution);
        Assert.True(deleted.IsSuccess);
        Assert.False(_store.HasContribution(contribution.Id));
    }

    [Fact]
    public async Task Contribution_under_another_goal_or_of_another_user_is_not_found()
    {
        var mine = _store.AddGoal(Me);
        var other = _store.AddGoal(Me);
        var inOther = _store.AddContribution(Me, other.Id);
        var theirGoal = _store.AddGoal(OtherUser);
        var theirs = _store.AddContribution(OtherUser, theirGoal.Id);

        var wrongGoal = await Update.HandleAsync(mine.Id, inOther.Id, new SaveContributionCommand(100, Today), default);
        var wrongUser = await Delete.HandleAsync(theirGoal.Id, theirs.Id, default);

        Assert.Equal(GoalErrors.ContributionNotFound, wrongGoal.Error);
        Assert.Equal(GoalErrors.ContributionNotFound, wrongUser.Error);
        Assert.True(_store.HasContribution(theirs.Id));
    }
}
