using Velos.Application.Common;

namespace Velos.Application.Accounts;

public static class AccountErrors
{
    /// <summary>Inexistente ou de outra pessoa: a mesma resposta (CA11).</summary>
    public static readonly AppError NotFound = new("not_found", ErrorKind.NotFound, "Conta não encontrada.");
}
