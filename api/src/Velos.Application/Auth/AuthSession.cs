using System.Text;

namespace Velos.Application.Auth;

/// <summary>Usuário de uma sessão emitida pelo Supabase Auth.</summary>
public sealed record UserIdentity(Guid Id, string? Email);

/// <summary>
/// Sessão emitida pelo Supabase Auth (resposta servidor a servidor, nunca vinda do navegador).
/// A API guarda os tokens em cookies httpOnly; eles nunca vão no corpo de uma resposta.
/// </summary>
public sealed record AuthSession(string AccessToken, string RefreshToken, int ExpiresInSeconds, UserIdentity User)
{
    // Um record imprime todas as propriedades no ToString(): sem isto, logar a sessão vazaria os tokens.
    private bool PrintMembers(StringBuilder builder)
    {
        builder.Append("User = ").Append(User).Append(", ExpiresInSeconds = ").Append(ExpiresInSeconds)
            .Append(", AccessToken = ***, RefreshToken = ***");
        return true;
    }
}
