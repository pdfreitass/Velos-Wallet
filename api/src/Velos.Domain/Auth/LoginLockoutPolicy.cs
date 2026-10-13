namespace Velos.Domain.Auth;

/// <summary>
/// RN5 da spec 001. Quem DECIDE o bloqueio é o banco (funções da migration 0005); estes valores
/// espelham os de lá só para montar as mensagens. Se mudar um, mude o outro.
/// </summary>
public static class LoginLockoutPolicy
{
    /// <summary>Falhas seguidas que bloqueiam o login (0005: <c>failed_count &gt;= 5</c>).</summary>
    public const int MaxFailedAttempts = 5;

    /// <summary>Duração do bloqueio (0005: <c>interval '10 minutes'</c>).</summary>
    public static readonly TimeSpan LockDuration = TimeSpan.FromMinutes(10);

    /// <summary>A partir desta falha a tela avisa quantas tentativas restam.</summary>
    public const int WarnFromFailure = 3;

    /// <summary>Tentativas restantes antes do bloqueio, ou null se ainda não é hora de avisar.</summary>
    public static int? AttemptsLeftToWarn(int failedCount) =>
        failedCount >= WarnFromFailure && failedCount < MaxFailedAttempts
            ? MaxFailedAttempts - failedCount
            : null;

    /// <summary>Minutos inteiros que faltam, arredondando para cima (nunca menos de 1).</summary>
    public static int MinutesLeft(DateTimeOffset lockedUntil, DateTimeOffset now) =>
        Math.Max(1, (int)Math.Ceiling((lockedUntil - now).TotalMinutes));
}
