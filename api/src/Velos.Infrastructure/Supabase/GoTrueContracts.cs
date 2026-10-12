using System.Text.Json;
using System.Text.Json.Serialization;

namespace Velos.Infrastructure.Supabase;

/// <summary>Sessão devolvida pelo Supabase Auth (GoTrue) em /token e /signup.</summary>
internal sealed record GoTrueSession(
    [property: JsonPropertyName("access_token")] string? AccessToken,
    [property: JsonPropertyName("refresh_token")] string? RefreshToken,
    [property: JsonPropertyName("expires_in")] int ExpiresIn,
    [property: JsonPropertyName("user")] GoTrueUser? User);

internal sealed record GoTrueUser(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("email")] string? Email);

/// <summary>
/// Corpo de erro do GoTrue. Com o header X-Supabase-Api-Version 2024-01-01 o código vem em
/// "code" (texto); versões antigas usam "error_code" ("code" numérico) e o /token usa "error".
/// </summary>
internal sealed record GoTrueError(
    [property: JsonPropertyName("code")] JsonElement Code,
    [property: JsonPropertyName("error_code")] string? ErrorCode,
    [property: JsonPropertyName("error")] string? OAuthError)
{
    public string? Resolve() =>
        Code.ValueKind == JsonValueKind.String ? Code.GetString()
        : ErrorCode ?? OAuthError;
}
