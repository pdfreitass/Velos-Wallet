namespace Velos.Domain.Auth;

/// <summary>Requisitos da senha forte (RN1 da spec 001), na ordem em que a tela os lista.</summary>
public enum PasswordRequirement
{
    MinLength,
    Lowercase,
    Uppercase,
    Number,
    Symbol,
}

/// <summary>
/// RN1 da spec 001. Exatamente as mesmas regras do Supabase (passo C1 do plano) e do Zod do front
/// (<c>web/src/lib/validations/auth.ts</c>): se divergirem, uma senha passa aqui e é recusada lá.
/// </summary>
public static class PasswordPolicy
{
    public const int MinLength = 8;

    /// <summary>Limite do bcrypt usado pelo Supabase.</summary>
    public const int MaxLength = 72;

    /// <summary>
    /// Exatamente os símbolos aceitos pelo Supabase em "Password requirements".
    /// Com "qualquer caractere não alfanumérico", um "ç" passaria aqui e seria recusado pelo Supabase.
    /// </summary>
    public const string Symbols = "!@#$%^&*()_+-=[]{};'\\:\"|<>?,./`~";

    /// <summary>Requisitos que a senha ainda não atende (lista vazia = senha forte).</summary>
    public static IReadOnlyList<PasswordRequirement> UnmetRequirements(string password)
    {
        ArgumentNullException.ThrowIfNull(password);

        var unmet = new List<PasswordRequirement>(5);
        if (password.Length < MinLength) unmet.Add(PasswordRequirement.MinLength);
        if (!password.Any(char.IsAsciiLetterLower)) unmet.Add(PasswordRequirement.Lowercase);
        if (!password.Any(char.IsAsciiLetterUpper)) unmet.Add(PasswordRequirement.Uppercase);
        if (!password.Any(char.IsAsciiDigit)) unmet.Add(PasswordRequirement.Number);
        if (!password.Any(Symbols.Contains)) unmet.Add(PasswordRequirement.Symbol);
        return unmet;
    }

    public static bool IsStrong(string password) =>
        password is not null && password.Length <= MaxLength && UnmetRequirements(password).Count == 0;
}
