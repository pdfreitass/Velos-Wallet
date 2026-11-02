using Velos.Application.Common;

namespace Velos.Application.Transactions;

public static class TransactionErrors
{
    /// <summary>Inexistente ou de outra pessoa: a mesma resposta (CA11).</summary>
    public static readonly AppError NotFound = new("not_found", ErrorKind.NotFound, "Transação não encontrada.");

    public const string AccountNotFound = "Conta não encontrada";

    public const string TypeChangeNotAllowed = "O tipo só pode trocar entre despesa e receita";
}
