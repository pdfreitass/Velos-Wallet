using FluentValidation.Results;

namespace Velos.Application.Common;

internal static class ValidationErrors
{
    /// <summary>
    /// Converte o resultado do FluentValidation num <see cref="AppError"/> com os erros por campo
    /// (nomes em camelCase, iguais aos campos do formulário do front).
    /// </summary>
    public static AppError From(ValidationResult validation)
    {
        var fields = validation.Errors
            .GroupBy(failure => ToCamelCase(failure.PropertyName))
            .ToDictionary(group => group.Key, group => group.Select(failure => failure.ErrorMessage).Distinct().ToArray());

        return new AppError(
            "validation_failed",
            ErrorKind.Validation,
            "Revise os campos destacados.",
            new Dictionary<string, object?> { ["errors"] = fields });
    }

    /// <summary>Erro num campo só, para regras que dependem do banco (ex.: conta de outra pessoa).</summary>
    public static AppError Field(string propertyName, string message) =>
        From(new ValidationResult([new ValidationFailure(propertyName, message)]));

    private static string ToCamelCase(string name) =>
        string.IsNullOrEmpty(name) ? name : char.ToLowerInvariant(name[0]) + name[1..];
}
