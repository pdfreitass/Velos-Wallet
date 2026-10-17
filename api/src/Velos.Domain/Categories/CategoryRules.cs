namespace Velos.Domain.Categories;

/// <summary>
/// RN9 da spec 002 (tamanho do nome). O nome único por tipo, sem diferenciar maiúsculas, quem
/// garante é o índice da migration 0009: checar antes de gravar teria corrida entre duas abas.
/// </summary>
public static class CategoryRules
{
    public const int NameMaxLength = 30;

    /// <summary>1 a 30 caracteres depois de tirar os espaços das pontas.</summary>
    public static bool IsValidName(string? name)
    {
        var trimmed = name?.Trim();
        return !string.IsNullOrEmpty(trimmed) && trimmed.Length <= NameMaxLength;
    }
}
