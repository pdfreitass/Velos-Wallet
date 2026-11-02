using Velos.Domain.Categories;

namespace Velos.Domain.Tests.Categories;

/// <summary>RN9 da spec 002 (tamanho do nome; a unicidade é do índice da 0009).</summary>
public class CategoryRulesTests
{
    [Theory]
    [InlineData("Pets")]
    [InlineData("  Lazer ")]
    public void Valid_names_are_accepted(string name) =>
        Assert.True(CategoryRules.IsValidName(name));

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Empty_names_are_refused(string? name) =>
        Assert.False(CategoryRules.IsValidName(name));

    [Fact]
    public void Name_limit_is_30_characters_after_trimming()
    {
        Assert.True(CategoryRules.IsValidName(new string('a', 30)));
        Assert.True(CategoryRules.IsValidName($" {new string('a', 30)} "));
        Assert.False(CategoryRules.IsValidName(new string('a', 31)));
    }
}
