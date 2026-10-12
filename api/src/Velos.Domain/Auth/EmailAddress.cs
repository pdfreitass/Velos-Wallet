namespace Velos.Domain.Auth;

public static class EmailAddress
{
    /// <summary>Limite prático de um endereço de email (RFC 5321).</summary>
    public const int MaxLength = 254;

    /// <summary>
    /// Forma canônica usada em todo o app: sem espaços nas pontas e em minúsculas.
    /// É a mesma normalização do front (Zod) e do hash do bloqueio no banco (<c>lower(trim(email))</c>).
    /// </summary>
    public static string Normalize(string? email) => (email ?? string.Empty).Trim().ToLowerInvariant();
}
