namespace Velos.Domain.Categories;

/// <summary>
/// RN10 da spec 002: paleta e ícones fixos. Espelho de <c>web/src/features/categories/catalog.ts</c>
/// (o front mapeia cada nome para o componente do lucide e cada cor para o tom de cada tema).
/// O banco guarda o hex "canônico" daqui; as 10 primeiras cores e os 9 primeiros ícones são os das
/// categorias padrão (migration 0003) e não podem sair da lista, ou essas categorias ficam inválidas.
/// </summary>
public static class CategoryCatalog
{
    public static IReadOnlyList<string> Colors { get; } =
    [
        "#E8833A", // Alimentação
        "#4F8DF7", // Moradia
        "#7C5CF5", // Transporte
        "#E05260", // Saúde
        "#D94FA8", // Lazer
        "#2F9BB8", // Educação
        "#6B8075", // Outros (despesa)
        "#1C7F54", // Salário
        "#2ED38C", // Freelance (e default da coluna na 0001)
        "#4FA37A", // Outros (receita)
        "#C7A23A", // mostarda
        "#8A6A4F", // marrom
    ];

    /// <summary>Nomes do lucide (kebab-case), conferidos no <c>lucide-react</c> do front.</summary>
    public static IReadOnlyList<string> Icons { get; } =
    [
        "utensils-crossed", "house", "car", "heart-pulse", "gamepad-2", "graduation-cap",
        "circle-dashed", "wallet", "briefcase",
        "tag", // default da coluna na 0001
        "shopping-cart", "shopping-bag", "coffee", "plane", "bus", "fuel", "shirt", "gift", "baby",
        "paw-print", "dumbbell", "film", "smartphone", "zap", "droplet", "receipt", "piggy-bank",
        "trending-up", "hand-coins", "pill",
    ];

    /// <summary>Sem diferenciar maiúsculas: "#e8833a" é a mesma cor. Gravar sempre <see cref="NormalizeColor"/>.</summary>
    public static bool IsAllowedColor(string? color) =>
        color is not null && Colors.Contains(color, StringComparer.OrdinalIgnoreCase);

    public static bool IsAllowedIcon(string? icon) =>
        icon is not null && Icons.Contains(icon, StringComparer.Ordinal);

    /// <summary>Hex em maiúsculas, como na paleta e nas categorias padrão.</summary>
    public static string NormalizeColor(string color) => color.ToUpperInvariant();
}
