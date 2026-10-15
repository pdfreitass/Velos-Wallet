using Velos.Application.Auth;
using Velos.Application.Common;

namespace Velos.Application.Abstractions;

/// <summary>Estado do bloqueio de um email (RN5). <see cref="LockedUntil"/> nulo = não bloqueado.</summary>
public sealed record LockoutState(int FailedCount, DateTimeOffset? LockedUntil);

/// <summary>
/// Resultado da reserva de uma tentativa. <see cref="Allowed"/> falso = email bloqueado, não chamar o
/// Supabase. <see cref="State"/> já conta ESTA tentativa (ver migration 0008).
/// </summary>
public sealed record LockoutReservation(bool Allowed, LockoutState State);

/// <summary>
/// Bloqueio de tentativas (migrations 0005 e 0008). Falhas de banco voltam como
/// <see cref="AuthErrors.LockoutUnavailable"/>, para o login falhar FECHADO.
/// </summary>
public interface ILoginLockout
{
    /// <summary>
    /// Conta a tentativa ANTES de chamar o Supabase, de forma atômica: tentativas em paralelo para o
    /// mesmo email entram em fila no banco e nunca passam de 5 por bloqueio (achado S3 da T23).
    /// </summary>
    Task<Result<LockoutReservation>> ReserveAttemptAsync(string email, CancellationToken cancellationToken);

    /// <summary>Zera as falhas do email do próprio usuário, que acabou de provar a senha.</summary>
    Task<Result<Unit>> ClearAsync(UserIdentity user, CancellationToken cancellationToken);
}
