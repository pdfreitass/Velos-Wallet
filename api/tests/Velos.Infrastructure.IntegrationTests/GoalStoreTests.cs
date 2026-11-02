using Velos.Application.Goals;

namespace Velos.Infrastructure.IntegrationTests;

/// <summary>
/// <see cref="Persistence.GoalStore"/> contra o banco real (spec 006). Precisa da migration 0013
/// (goal_progress com contagem, falta e excedente). Cada teste apaga as metas que criou; os aportes
/// vão junto pelo cascade.
/// </summary>
public class GoalStoreTests
{
    private static readonly DateOnly Day = new(2001, 3, 10);

    [DatabaseFact(RequiresTestUser = true)]
    public async Task Progress_is_summed_in_the_database()
    {
        await using var me = StoreTestContext.Me();
        var goal = await NewGoalAsync(me, 100_000, null);
        try
        {
            var first = (await me.Goals.AddContributionAsync(me.UserId, goal, new ContributionData(30_000, Day), default)).Value;
            await me.Goals.AddContributionAsync(me.UserId, goal, new ContributionData(20_000, Day.AddDays(1)), default);

            var progress = (await me.Goals.GetAsync(me.UserId, goal, default)).Value!;
            Assert.Equal((50_000L, 2, 50_000L, 0L), (progress.CurrentCents, progress.ContributionCount, progress.RemainingCents, progress.ExcessCents));

            // Editar e passar do alvo: falta zera e o excedente aparece (RN4).
            Assert.True((await me.Goals.UpdateContributionAsync(me.UserId, goal, first!.Value, new ContributionData(90_000, Day), default)).Value);
            progress = (await me.Goals.GetAsync(me.UserId, goal, default)).Value!;
            Assert.Equal((110_000L, 0L, 10_000L), (progress.CurrentCents, progress.RemainingCents, progress.ExcessCents));

            // Aportes do mais recente para o mais antigo.
            var contributions = (await me.Goals.ListContributionsAsync(me.UserId, goal, default)).Value;
            Assert.Equal([Day.AddDays(1), Day], contributions.Select(c => c.Date));

            Assert.True((await me.Goals.DeleteContributionAsync(me.UserId, goal, first.Value, default)).Value);
            Assert.Equal(1, (await me.Goals.GetAsync(me.UserId, goal, default)).Value!.ContributionCount);
        }
        finally
        {
            await me.Goals.DeleteAsync(me.UserId, goal, default);
        }
    }

    [DatabaseFact(RequiresTestUser = true)]
    public async Task List_puts_reached_goals_last_and_nearest_deadline_first()
    {
        await using var me = StoreTestContext.Me();
        var noDeadline = await NewGoalAsync(me, 10_000, null);
        var later = await NewGoalAsync(me, 10_000, new DateOnly(2099, 12, 1));
        var sooner = await NewGoalAsync(me, 10_000, new DateOnly(2099, 1, 1));
        var reached = await NewGoalAsync(me, 10_000, new DateOnly(2098, 1, 1));
        try
        {
            await me.Goals.AddContributionAsync(me.UserId, reached, new ContributionData(10_000, Day), default);

            var mine = new[] { noDeadline, later, sooner, reached };
            var order = (await me.Goals.ListAsync(me.UserId, default)).Value.Select(g => g.Id).Where(mine.Contains);
            Assert.Equal([sooner, later, noDeadline, reached], order);
        }
        finally
        {
            foreach (var id in new[] { noDeadline, later, sooner, reached })
            {
                await me.Goals.DeleteAsync(me.UserId, id, default);
            }
        }
    }

    [DatabaseFact(RequiresTestUser = true)]
    public async Task Update_and_delete_report_missing_goals()
    {
        await using var me = StoreTestContext.Me();
        var goal = await NewGoalAsync(me, 50_000, null);

        var edited = new GoalData(StoreTestContext.UniqueName("Viagem"), 80_000, new DateOnly(2099, 6, 1));
        Assert.True((await me.Goals.UpdateAsync(me.UserId, goal, edited, default)).Value);
        var progress = (await me.Goals.GetAsync(me.UserId, goal, default)).Value!;
        Assert.Equal((edited.Name, 80_000L, edited.Deadline), (progress.Name, progress.TargetCents, progress.Deadline));

        Assert.True((await me.Goals.DeleteAsync(me.UserId, goal, default)).Value);
        Assert.Null((await me.Goals.GetAsync(me.UserId, goal, default)).Value);
        Assert.False((await me.Goals.DeleteAsync(me.UserId, goal, default)).Value);
        Assert.False((await me.Goals.UpdateAsync(me.UserId, goal, edited, default)).Value);
    }

    [DatabaseFact(RequiresTestUser = true)]
    public async Task Another_user_cannot_read_or_change_my_goal()
    {
        await using var me = StoreTestContext.Me();
        await using var stranger = StoreTestContext.Stranger();
        var goal = await NewGoalAsync(me, 100_000, null);
        try
        {
            var contribution = (await me.Goals.AddContributionAsync(me.UserId, goal, new ContributionData(5_000, Day), default)).Value!.Value;

            Assert.Empty((await stranger.Goals.ListAsync(stranger.UserId, default)).Value);
            Assert.Null((await stranger.Goals.GetAsync(stranger.UserId, goal, default)).Value);
            Assert.Empty((await stranger.Goals.ListContributionsAsync(stranger.UserId, goal, default)).Value);
            Assert.False((await stranger.Goals.UpdateAsync(stranger.UserId, goal, new GoalData("Roubada", 1, null), default)).Value);
            Assert.False((await stranger.Goals.DeleteAsync(stranger.UserId, goal, default)).Value);
            // Aporte em meta alheia não entra (404 na API).
            Assert.Null((await stranger.Goals.AddContributionAsync(stranger.UserId, goal, new ContributionData(1, Day), default)).Value);
            Assert.False((await stranger.Goals.UpdateContributionAsync(stranger.UserId, goal, contribution, new ContributionData(1, Day), default)).Value);
            Assert.False((await stranger.Goals.DeleteContributionAsync(stranger.UserId, goal, contribution, default)).Value);

            var progress = (await me.Goals.GetAsync(me.UserId, goal, default)).Value!;
            Assert.Equal((100_000L, 5_000L, 1), (progress.TargetCents, progress.CurrentCents, progress.ContributionCount));
        }
        finally
        {
            await me.Goals.DeleteAsync(me.UserId, goal, default);
        }
    }

    private static async Task<Guid> NewGoalAsync(StoreTestContext context, long targetCents, DateOnly? deadline)
    {
        var result = await context.Goals.CreateAsync(
            context.UserId, new GoalData(StoreTestContext.UniqueName("Meta"), targetCents, deadline), default);
        Assert.True(result.IsSuccess, result.Error?.Code);
        return result.Value;
    }
}
