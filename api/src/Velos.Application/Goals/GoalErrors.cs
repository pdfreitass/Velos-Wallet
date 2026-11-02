using Velos.Application.Common;

namespace Velos.Application.Goals;

public static class GoalErrors
{
    /// <summary>Inexistente ou de outra pessoa: a mesma resposta (CA-seg).</summary>
    public static readonly AppError NotFound = new("not_found", ErrorKind.NotFound, "Meta não encontrada.");

    /// <summary>Inexistente, de outra meta ou de outra pessoa: a mesma resposta.</summary>
    public static readonly AppError ContributionNotFound = new("not_found", ErrorKind.NotFound, "Aporte não encontrado.");
}
