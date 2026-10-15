using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Velos.Application.Abstractions;
using Velos.Application.Auth;
using Velos.Application.Common;

namespace Velos.Infrastructure.Persistence;

/// <summary>
/// Bloqueio de tentativas pelas funções das migrations 0005 e 0008. A tabela não é acessível direto:
/// antes do login roda como <c>anon</c>; zerar exige o usuário que acabou de provar a senha.
/// </summary>
internal sealed partial class LoginLockoutStore(UserDbSession session, ILogger<LoginLockoutStore> logger) : ILoginLockout
{
    public async Task<Result<LockoutReservation>> ReserveAttemptAsync(string email, CancellationToken cancellationToken)
    {
        try
        {
            var row = await session.AsAnonAsync(
                (db, ct) => db.Database
                    .SqlQuery<ReservationRow>($"""
                        select failed_count as "FailedCount", locked_until as "LockedUntil", allowed as "Allowed"
                        from public.reserve_login_attempt({email})
                        """)
                    .SingleAsync(ct),
                cancellationToken);
            return Result.Success(new LockoutReservation(row.Allowed, new LockoutState(row.FailedCount, row.LockedUntil)));
        }
        catch (Exception exception) when (exception is DbException or TimeoutException)
        {
            LogUnavailable(logger, exception);
            return Result.Failure<LockoutReservation>(AuthErrors.LockoutUnavailable);
        }
    }

    public async Task<Result<Unit>> ClearAsync(UserIdentity user, CancellationToken cancellationToken)
    {
        try
        {
            await session.AsUserAsync(
                user,
                (db, ct) => db.Database.ExecuteSqlAsync($"select public.clear_my_login_failures()", ct),
                cancellationToken);
            return Result.Ok();
        }
        catch (Exception exception) when (exception is DbException or TimeoutException)
        {
            LogClearFailed(logger, exception);
            return Result.Failure<Unit>(AuthErrors.LockoutUnavailable);
        }
    }

    [LoggerMessage(Level = LogLevel.Error, Message = "Bloqueio de tentativas indisponível: login recusado (falha fechada)")]
    private static partial void LogUnavailable(ILogger logger, Exception exception);

    [LoggerMessage(Level = LogLevel.Warning, Message = "Não foi possível zerar as falhas de login após entrar")]
    private static partial void LogClearFailed(ILogger logger, Exception exception);

    private sealed class ReservationRow
    {
        public int FailedCount { get; set; }

        public DateTimeOffset? LockedUntil { get; set; }

        public bool Allowed { get; set; }
    }
}
