namespace Velos.Application.Abstractions;

/// <summary>
/// Usuário da request atual, vindo de um JWT do Supabase já validado pela API.
/// O id do usuário sai SÓ daqui (claim "sub"), nunca de dado enviado pelo cliente.
/// </summary>
public interface IUserContext
{
    bool IsAuthenticated { get; }

    /// <summary>Claim "sub". Lança <see cref="InvalidOperationException"/> se não houver usuário autenticado.</summary>
    Guid UserId { get; }

    /// <summary>Claim "email" (pode faltar, por exemplo, em contas sem email).</summary>
    string? Email { get; }
}
