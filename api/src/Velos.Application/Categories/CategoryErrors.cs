using Velos.Application.Common;
using Velos.Domain.Categories;

namespace Velos.Application.Categories;

public static class CategoryErrors
{
    public const string NameTakenCode = "category_name_taken";

    /// <summary>Inexistente ou de outra pessoa: a mesma resposta (CA11).</summary>
    public static readonly AppError NotFound = new("not_found", ErrorKind.NotFound, "Categoria não encontrada.");

    /// <summary>
    /// RN9 / CA9. Vem com o erro no campo <c>name</c>, para o formulário mostrar no lugar certo.
    /// Sem o tipo (o store não sabe qual é na edição), a mensagem é genérica; o handler troca pela do tipo.
    /// </summary>
    public static AppError NameTaken(CategoryType? type)
    {
        var message = type switch
        {
            CategoryType.Expense => "Você já tem uma categoria de despesa com esse nome",
            CategoryType.Income => "Você já tem uma categoria de receita com esse nome",
            _ => "Você já tem uma categoria com esse nome",
        };

        return new AppError(
            NameTakenCode,
            ErrorKind.Conflict,
            message,
            new Dictionary<string, object?> { ["errors"] = new Dictionary<string, string[]> { ["name"] = [message] } });
    }

    /// <summary>Troca o <see cref="NameTaken"/> genérico do store pelo do tipo; outros erros passam iguais.</summary>
    internal static AppError ForType(AppError error, CategoryType type) =>
        error.Code == NameTakenCode ? NameTaken(type) : error;
}
