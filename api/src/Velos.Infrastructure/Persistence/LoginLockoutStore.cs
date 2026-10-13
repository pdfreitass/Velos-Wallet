using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Velos.Application.Abstractions;
using Velos.Application.Auth;
using Velos.Application.Common;

namespace Velos.Infrastructure.Persistence;

/// <summary>
/// Bloqueio de tentativas pelas funções da migration 0005. A tabela não é acessível direto:
/// antes do login roda como <c>anon</c>; zerar exige o usuário que acabou de provar a senha.
/// </summary>
internal sealed partial class LoginLockoutStore(UserDbSession session, ILogger<LoginLockoutStore> logger) : ILoginLockout
{
    public Task<Result<LockoutState>> GetStateAsync(string email, CancellationToken cancellationToken) =>
        QueryAsync((db, ct) => db.Database
            .SqlQuery<LockoutRow>($"""
                select failed_count as "FailedCount", locked_until as "LockedUntil"
                from public.login_lock_status({email})
                """)
            .SingleAsync(ct), cancellationToken);

    public Task<Result<LockoutState>> RegisterFailureAsync(string email, CancellationToken cancellationToken) =>
        QueryAsync((db, ct) => db.Database
            .SqlQuery<LockoutRow>($"""
                select failed_count as "FailedCount", locked_until as "LockedUntil"
                from public.register_login_failure({email})
                """)
            .SingleAsync(ct), cancellationToken);

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

    private async Task<Result<LockoutState>> QueryAsync(
        Func<VelosDbContext, CancellationToken, Task<LockoutRow>> query, CancellationToken cancellationToken)
    {
        try
        {
            var row = await session.AsAnonAsync(query, cancellationToken);
            return Result.Success(new LockoutState(row.FailedCount, row.LockedUntil));
        }
        catch (Exception exception) when (exception is DbException or TimeoutException)
        {
            LogUnavailable(logger, exception);
            return Result.Failure<LockoutState>(AuthErrors.LockoutUnavailable);
        }
    }

    [LoggerMessage(Level = LogLevel.Error, Message = "Bloqueio de tentativas indisponível: login recusado (falha fechada)")]
    private static partial void LogUnavailable(ILogger logger, Exception exception);

    [LoggerMessage(Level = LogLevel.Warning, Message = "Não foi possível zerar as falhas de login após entrar")]
    private static partial void LogClearFailed(ILogger logger, Exception exception);

    private sealed class LockoutRow
    {
        public int FailedCount { get; set; }

        public DateTimeOffset? LockedUntil { get; set; }
    }
}
