using Velos.Application.Categories;
using Velos.Application.Common;
using Velos.Domain.Categories;

namespace Velos.Application.Tests.Categories;

/// <summary>Criar e editar categoria: RN8–RN10, CA8, CA9 e CA11 da spec 002.</summary>
public class SaveCategoryHandlerTests
{
    private static readonly Guid OtherUser = Guid.Parse("99999999-9999-9999-9999-999999999999");

    private readonly FakeUserContext _user = new();
    private readonly FakeCategoryStore _store = new();

    private CreateCategoryHandler Create => new(new CategoryInputValidator(), _user, _store);

    private UpdateCategoryHandler Update => new(new CategoryInputValidator(), _user, _store);

    [Fact]
    public async Task Create_trims_the_name_normalizes_the_color_and_uses_the_jwt_user()
    {
        var result = await Create.HandleAsync(new CreateCategoryCommand(" Pets ", CategoryType.Expense, "#c7a23a", "paw-print"), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(["create:Pets|Expense|#C7A23A|paw-print"], _store.Calls);
        Assert.Equal([FakeUserContext.DefaultUserId], _store.UserIds);
    }

    /// <summary>CA9: "lazer" de despesa com "Lazer" de despesa existente é recusado; de receita, aceito.</summary>
    [Fact]
    public async Task Same_name_is_refused_in_the_same_type_only()
    {
        _store.Add(FakeUserContext.DefaultUserId, Category("Lazer", CategoryType.Expense));

        var expense = await Create.HandleAsync(new CreateCategoryCommand("lazer", CategoryType.Expense, "#D94FA8", "gamepad-2"), default);
        var income = await Create.HandleAsync(new CreateCategoryCommand("Lazer", CategoryType.Income, "#D94FA8", "gamepad-2"), default);

        Assert.Equal(CategoryErrors.NameTakenCode, expense.Error!.Code);
        Assert.Equal(ErrorKind.Conflict, expense.Error.Kind);
        Assert.Equal(["Você já tem uma categoria de despesa com esse nome"], FieldErrors(expense.Error)["name"]);
        Assert.True(income.IsSuccess);
    }

    [Fact]
    public async Task Another_users_category_with_the_same_name_does_not_conflict()
    {
        _store.Add(OtherUser, Category("Pets", CategoryType.Expense));

        var result = await Create.HandleAsync(new CreateCategoryCommand("Pets", CategoryType.Expense, "#8A6A4F", "paw-print"), default);

        Assert.True(result.IsSuccess);
    }

    [Theory]
    [InlineData("", "#E8833A", "house", "name", "Informe o nome da categoria")]
    [InlineData("  ", "#E8833A", "house", "name", "Informe o nome da categoria")]
    [InlineData("1234567890123456789012345678901", "#E8833A", "house", "name", "O nome pode ter no máximo 30 caracteres")]
    [InlineData("Pets", "#000000", "house", "color", "Escolha uma cor da lista")]
    [InlineData("Pets", "#E8833A", "rocket", "icon", "Escolha um ícone da lista")]
    public async Task Invalid_fields_are_refused_with_the_field_message(string name, string color, string icon, string field, string message)
    {
        var result = await Create.HandleAsync(new CreateCategoryCommand(name, CategoryType.Expense, color, icon), default);

        Assert.Equal([message], ValidationFields(result)[field]);
        Assert.Empty(_store.Calls);
    }

    [Theory]
    [InlineData(null)]
    [InlineData((CategoryType)99)]
    public async Task Missing_or_unknown_type_is_refused(CategoryType? type)
    {
        var result = await Create.HandleAsync(new CreateCategoryCommand("Pets", type, "#E8833A", "house"), default);

        Assert.Equal(["Escolha o tipo da categoria"], ValidationFields(result)["type"]);
    }

    [Fact]
    public async Task Update_changes_name_color_and_icon_and_keeps_the_type()
    {
        var category = _store.Add(FakeUserContext.DefaultUserId, Category("Mercado", CategoryType.Expense));

        var result = await Update.HandleAsync(new UpdateCategoryCommand(category.Id, " Feira ", "#4fa37a", "shopping-cart"), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(category with { Name = "Feira", Color = "#4FA37A", Icon = "shopping-cart" }, _store.Find(category.Id));
    }

    [Fact]
    public async Task Update_to_a_taken_name_says_which_type()
    {
        _store.Add(FakeUserContext.DefaultUserId, Category("Freelance", CategoryType.Income));
        var bonus = _store.Add(FakeUserContext.DefaultUserId, Category("Bônus", CategoryType.Income));

        var result = await Update.HandleAsync(new UpdateCategoryCommand(bonus.Id, "FREELANCE", "#2ED38C", "briefcase"), default);

        Assert.Equal(["Você já tem uma categoria de receita com esse nome"], FieldErrors(result.Error!)["name"]);
    }

    [Fact]
    public async Task Update_of_someone_elses_category_is_not_found_and_changes_nothing()
    {
        var theirs = _store.Add(OtherUser, Category("Pets", CategoryType.Expense));

        var result = await Update.HandleAsync(new UpdateCategoryCommand(theirs.Id, "Minha", "#E8833A", "house"), default);

        Assert.Equal(CategoryErrors.NotFound, result.Error);
        Assert.Equal(theirs, _store.Find(theirs.Id));
        Assert.All(_store.UserIds, id => Assert.Equal(FakeUserContext.DefaultUserId, id));
    }

    internal static CategorySummary Category(string name, CategoryType type) =>
        new(Guid.NewGuid(), name, type, "#E8833A", "tag");

    private static Dictionary<string, string[]> ValidationFields<T>(Result<T> result)
    {
        Assert.Equal("validation_failed", result.Error!.Code);
        return FieldErrors(result.Error);
    }

    private static Dictionary<string, string[]> FieldErrors(AppError error) =>
        Assert.IsType<Dictionary<string, string[]>>(error.Details!["errors"]);
}
