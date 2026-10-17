using System.Text.Json;

namespace Velos.Api.Http;

/// <summary>
/// Enums no JSON em camelCase (<c>"creditCard"</c>, <c>"expense"</c>), iguais ao conversor de saída
/// registrado no Program.cs. Na entrada, valor desconhecido vira <c>null</c> e o validador responde
/// com a mensagem do campo, em vez do 400 genérico do model binding.
/// </summary>
internal static class ApiEnums
{
    public static readonly JsonNamingPolicy Naming = JsonNamingPolicy.CamelCase;

    /// <summary>Só o nome exato: "1", "CreditCard" ou "credit_card" não valem (Enum.TryParse aceitaria número).</summary>
    public static T? Parse<T>(string? value) where T : struct, Enum
    {
        foreach (var candidate in Enum.GetValues<T>())
        {
            if (Naming.ConvertName(candidate.ToString()) == value) return candidate;
        }

        return null;
    }
}
