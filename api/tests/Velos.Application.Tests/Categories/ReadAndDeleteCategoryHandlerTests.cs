using Velos.Application.Categories;
using Velos.Application.Common;
using Velos.Domain.Categories;
using static Velos.Application.Tests.Categories.SaveCategoryHandlerTests;

namespace Velos.Application.Tests.Categories;

/// <summary>Listar, abrir, impacto da exclusão e excluir: RN11, RN12, CA10 e CA11 da spec 002.</summary>
public class ReadAndDeleteCategoryHandlerTests
{
    private static readonly Guid OtherUser = Guid.Parse("99999999-9999-9999-9999-999999999999");

    private readonly FakeUserContext _user = new();
    private readonly FakeCategoryStore _store = new();

    [Fact]
    public async Task List_returns_only_the_categories_of_the_jwt_user()
    {
        var mine = _store.Add(FakeUserContext.DefaultUserId, Category("Lazer", CategoryType.Expense));
        _store.Add(OtherUser, Category("Pets", CategoryType.Expense));

        var result = await new ListCategoriesHandler(_user, _store).HandleAsync(default);

        Assert.Equal([mine], result.Value);
        Assert.Equal([FakeUserContext.DefaultUserId], _store.UserIds);
    }

    [Fact]
    public async Task Get_returns_my_category()
    {
        var mine = _store.Add(FakeUserContext.DefaultUserId, Category("Salário", CategoryType.Income));

        Assert.Equal(mine, (await new GetCategoryHandler(_user, _store).HandleAsync(mine.Id, default)).Value);
    }

    /// <summary>CA11: de outra pessoa e inexistente dão exatamente o mesmo erro, em toda operação por id.</summary>
    [Fact]
    public async Task Someone_elses_and_missing_categories_give_the_same_not_found()
    {
        var theirs = _store.Add(OtherUser, Category("Pets", CategoryType.Expense)).Id;

        foreach (var id in new[] { theirs, Guid.NewGuid() })
        {
            Assert.Equal(CategoryErrors.NotFound, (await new GetCategoryHandler(_user, _store).HandleAsync(id, default)).Error);
            Assert.Equal(CategoryErrors.NotFound, (await new GetCategoryDeletionImpactHandler(_user, _store).HandleAsync(id, default)).Error);
            Assert.Equal(CategoryErrors.NotFound, (await new DeleteCategoryHandler(_user, _store).HandleAsync(id, default)).Error);
        }

        Assert.NotNull(_store.Find(theirs));
        Assert.All(_store.UserIds, id => Assert.Equal(FakeUserContext.DefaultUserId, id));
    }

    [Fact]
    public async Task Deletion_impact_counts_the_transactions()
    {
        var mine = _store.Add(FakeUserContext.DefaultUserId, Category("Lazer", CategoryType.Expense));
        _store.TransactionCount = 7;

        var result = await new GetCategoryDeletionImpactHandler(_user, _store).HandleAsync(mine.Id, default);

        Assert.Equal(new CategoryDeletionImpact(7), result.Value);
    }

    [Fact]
    public async Task Delete_removes_my_category()
    {
        var mine = _store.Add(FakeUserContext.DefaultUserId, Category("Outros", CategoryType.Expense));

        Assert.True((await new DeleteCategoryHandler(_user, _store).HandleAsync(mine.Id, default)).IsSuccess);
        Assert.Null(_store.Find(mine.Id));
    }

    [Fact]
    public async Task Database_failure_is_passed_through()
    {
        _store.Failure = CommonErrors.DatabaseUnavailable;

        Assert.Equal(CommonErrors.DatabaseUnavailable, (await new ListCategoriesHandler(_user, _store).HandleAsync(default)).Error);
        Assert.Equal(CommonErrors.DatabaseUnavailable,
            (await new CreateCategoryHandler(new CategoryInputValidator(), _user, _store)
                .HandleAsync(new CreateCategoryCommand("Pets", CategoryType.Expense, "#E8833A", "house"), default)).Error);
    }
}
