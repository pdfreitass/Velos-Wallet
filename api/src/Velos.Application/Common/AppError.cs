namespace Velos.Application.Common;

/// <summary>Categoria do erro; a API traduz em status HTTP.</summary>
public enum ErrorKind
{
    /// <summary>Entrada inválida (400).</summary>
    Validation,

    /// <summary>Email ou senha incorretos (400: não é "sessão expirada").</summary>
    InvalidCredentials,

    /// <summary>Sem sessão válida (401).</summary>
    Unauthorized,

    /// <summary>Sem permissão para esta ação (403).</summary>
    Forbidden,

    /// <summary>Recurso inexistente (404).</summary>
    NotFound,

    /// <summary>Conflito com o estado atual, ex.: email já cadastrado (409).</summary>
    Conflict,

    /// <summary>Bloqueio ou limite de tentativas/envios (429).</summary>
    TooManyRequests,

    /// <summary>Dependência fora do ar: Supabase ou banco (503).</summary>
    Unavailable,
}

/// <summary>
/// Erro esperado de um caso de uso. O front traduz pelo <see cref="Code"/> (estável);
/// <see cref="Message"/> é o texto padrão em português. Nunca carrega mensagem crua do Supabase.
/// </summary>
public sealed record AppError(
    string Code,
    ErrorKind Kind,
    string Message,
    IReadOnlyDictionary<string, object?>? Details = null);
