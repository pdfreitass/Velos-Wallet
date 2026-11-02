using System.Data.Common;
using Microsoft.Extensions.Logging;
using Npgsql;
using Velos.Application.Common;

namespace Velos.Infrastructure.Persistence;

/// <summary>
/// Traduz falhas do banco em <see cref="AppError"/> sem repassar a mensagem do Postgres (CLAUDE.md).
/// Check, FK e not null viram <c>validation_failed</c>: a Application já validou, então chegar aqui
/// é sinal de corrida ou de regra só do banco. Conexão e timeout viram <c>database_unavailable</c>.
/// </summary>
internal static partial class StoreGuard
{
    private static readonly AppError RefusedByDatabase = new(
        "validation_failed", ErrorKind.Validation, "Revise os campos destacados.");

    public static async Task<Result<T>> RunAsync<T>(
        ILogger logger,
        string operation,
        Func<Task<T>> work,
        Func<PostgresException, AppError?>? translate = null)
    {
        try
        {
            return Result.Success(await work());
        }
        catch (PostgresException exception) when (translate?.Invoke(exception) is { } error)
        {
            return Result.Failure<T>(error);
        }
        catch (PostgresException exception) when (exception.SqlState is PostgresErrorCodes.CheckViolation
                                                      or PostgresErrorCodes.ForeignKeyViolation
                                                      or PostgresErrorCodes.NotNullViolation)
        {
            LogRefused(logger, operation, exception.SqlState, exception.ConstraintName);
            return Result.Failure<T>(RefusedByDatabase);
        }
        catch (Exception exception) when (exception is DbException or TimeoutException)
        {
            LogUnavailable(logger, operation, exception);
            return Result.Failure<T>(CommonErrors.DatabaseUnavailable);
        }
    }

    [LoggerMessage(Level = LogLevel.Warning, Message = "Banco recusou {Operation}: {SqlState} em {Constraint}")]
    private static partial void LogRefused(ILogger logger, string operation, string sqlState, string? constraint);

    [LoggerMessage(Level = LogLevel.Error, Message = "Banco indisponível em {Operation}")]
    private static partial void LogUnavailable(ILogger logger, string operation, Exception exception);
}
