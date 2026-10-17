using System.Text.RegularExpressions;
using Velos.Domain.Categories;

namespace Velos.Domain.Tests.Categories;

/// <summary>RN10 da spec 002.</summary>
public class CategoryCatalogTests
{
    /// <summary>Cor e ícone das 10 categorias padrão (migration 0003): todas precisam estar no catálogo.</summary>
    [Theory]
    [InlineData("#E8833A", "utensils-crossed")]
    [InlineData("#4F8DF7", "house")]
    [InlineData("#7C5CF5", "car")]
    [InlineData("#E05260", "heart-pulse")]
    [InlineData("#D94FA8", "gamepad-2")]
    [InlineData("#2F9BB8", "graduation-cap")]
    [InlineData("#6B8075", "circle-dashed")]
    [InlineData("#1C7F54", "wallet")]
    [InlineData("#2ED38C", "briefcase")]
    [InlineData("#4FA37A", "circle-dashed")]
    public void Default_categories_are_in_the_catalog(string color, string icon)
    {
        Assert.True(CategoryCatalog.IsAllowedColor(color));
        Assert.True(CategoryCatalog.IsAllowedIcon(icon));
    }

    [Fact]
    public void Column_defaults_are_in_the_catalog()
    {
        Assert.True(CategoryCatalog.IsAllowedColor("#2ED38C"));
        Assert.True(CategoryCatalog.IsAllowedIcon("tag"));
    }

    [Fact]
    public void Sizes_match_the_spec()
    {
        Assert.Equal(12, CategoryCatalog.Colors.Count);
        Assert.Equal(30, CategoryCatalog.Icons.Count);
    }

    [Fact]
    public void Entries_are_unique_and_well_formed()
    {
        Assert.Equal(CategoryCatalog.Colors.Count, CategoryCatalog.Colors.Distinct(StringComparer.OrdinalIgnoreCase).Count());
        Assert.Equal(CategoryCatalog.Icons.Count, CategoryCatalog.Icons.Distinct().Count());

        // Mesmo formato da check da coluna color (0001), em maiúsculas como a paleta.
        Assert.All(CategoryCatalog.Colors, c => Assert.Matches(new Regex("^#[0-9A-F]{6}$"), c));
        Assert.All(CategoryCatalog.Icons, i => Assert.Matches(new Regex("^[a-z0-9]+(-[a-z0-9]+)*$"), i));
    }

    [Fact]
    public void Color_is_case_insensitive_and_normalized_to_upper_case()
    {
        Assert.True(CategoryCatalog.IsAllowedColor("#e8833a"));
        Assert.Equal("#E8833A", CategoryCatalog.NormalizeColor("#e8833a"));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("#000000")]
    [InlineData("E8833A")]          // sem #
    [InlineData("red")]
    public void Colors_outside_the_palette_are_refused(string? color) =>
        Assert.False(CategoryCatalog.IsAllowedColor(color));

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("House")]           // nome do lucide é minúsculo
    [InlineData("rocket")]          // existe no lucide, mas não está na lista
    [InlineData("<script>")]
    public void Icons_outside_the_list_are_refused(string? icon) =>
        Assert.False(CategoryCatalog.IsAllowedIcon(icon));
}
