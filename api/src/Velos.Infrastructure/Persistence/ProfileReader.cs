using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Velos.Application.Abstractions;
using Velos.Application.Common;
using Velos.Application.Profiles;

namespace Velos.Infrastructure.Persistence;

internal sealed partial class ProfileReader(UserDbSession session, IUserContext user, ILogger<ProfileReader> logger)
    : IProfileReader
{
    public async Task<Result<CurrentProfile>> GetCurrentAsync(CancellationToken cancellationToken)
    {
        var userId = user.UserId;
        try
        {
            // O filtro por id é a primeira barreira; a RLS (sessão do usuário) é a segunda.
            var name = await session.AsUserAsync(
                (db, ct) => db.Database
                    .SqlQuery<string>($"select name as \"Value\" from public.profiles where id = {userId}")
                    .SingleOrDefaultAsync(ct),
                cancellationToken);

            return name is null
                ? Result.Failure<CurrentProfile>(CommonErrors.ProfileNotFound)
                : Result.Success(new CurrentProfile(name, user.Email));
        }
        catch (Exception exception) when (exception is DbException or TimeoutException)
        {
            LogUnavailable(logger, exception);
            return Result.Failure<CurrentProfile>(CommonErrors.DatabaseUnavailable);
        }
    }

    [LoggerMessage(Level = LogLevel.Error, Message = "Falha ao ler o perfil do usuário")]
    private static partial void LogUnavailable(ILogger logger, Exception exception);
}
