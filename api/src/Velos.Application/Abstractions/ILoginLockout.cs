using Velos.Application.Auth;
using Velos.Application.Common;

namespace Velos.Application.Abstractions;

/// <summary>Estado do bloqueio de um email (RN5). <see cref="LockedUntil"/> nulo = não bloqueado.</summary>
public sealed record LockoutState(int FailedCount, DateTimeOffset? LockedUntil);

/// <summary>
/// Bloqueio de tentativas (migration 0005). Falhas de banco voltam como
/// <see cref="AuthErrors.LockoutUnavailable"/>, para o login falhar FECHADO.
/// </summary>
public interface ILoginLockout
{
    Task<Result<LockoutState>> GetStateAsync(string email, CancellationToken cancellationToken);

    Task<Result<LockoutState>> RegisterFailureAsync(string email, CancellationToken cancellationToken);

    /// <summary>Zera as falhas do email do próprio usuário, que acabou de provar a senha.</summary>
    Task<Result<Unit>> ClearAsync(UserIdentity user, CancellationToken cancellationToken);
}
