using Velos.Application.Common;
using Velos.Application.Profiles;

namespace Velos.Application.Abstractions;

public interface IProfileReader
{
    /// <summary>Perfil do usuário autenticado da request (sob RLS).</summary>
    Task<Result<CurrentProfile>> GetCurrentAsync(CancellationToken cancellationToken);
}
