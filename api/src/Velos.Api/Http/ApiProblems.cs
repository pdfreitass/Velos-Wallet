using System.Globalization;
using Microsoft.AspNetCore.Mvc;
using Velos.Application.Common;

namespace Velos.Api.Http;

internal static class ApiProblems
{
    /// <summary>Códigos padrão quando o erro não veio de um caso de uso (ex.: 401 do JwtBearer).</summary>
    public static string DefaultCode(int? status) => status switch
    {
        StatusCodes.Status401Unauthorized => "unauthenticated",
        StatusCodes.Status403Forbidden => "forbidden",
        StatusCodes.Status404NotFound => "not_found",
        StatusCodes.Status405MethodNotAllowed => "method_not_allowed",
        StatusCodes.Status415UnsupportedMediaType => "unsupported_media_type",
        >= 500 => "internal_error",
        _ => "bad_request",
    };

    /// <summary>
    /// Converte um <see cref="AppError"/> em ProblemDetails (RFC 9457) com "code" estável e os detalhes
    /// (attemptsLeft, minutesLeft, errors) no primeiro nível, como o front espera.
    /// </summary>
    public static ObjectResult ToProblem(this ControllerBase controller, AppError error)
    {
        var status = StatusFor(error.Kind);
        var problem = controller.ProblemDetailsFactory.CreateProblemDetails(
            controller.HttpContext, statusCode: status, detail: error.Message);

        problem.Extensions["code"] = error.Code;
        foreach (var (key, value) in error.Details ?? new Dictionary<string, object?>())
        {
            problem.Extensions[key] = value;
        }

        if (error.Details?.GetValueOrDefault("minutesLeft") is int minutesLeft)
        {
            controller.Response.Headers.RetryAfter = (minutesLeft * 60).ToString(CultureInfo.InvariantCulture);
        }

        return new ObjectResult(problem) { StatusCode = status, ContentTypes = { "application/problem+json" } };
    }

    private static int StatusFor(ErrorKind kind) => kind switch
    {
        ErrorKind.Validation or ErrorKind.InvalidCredentials => StatusCodes.Status400BadRequest,
        ErrorKind.Unauthorized => StatusCodes.Status401Unauthorized,
        ErrorKind.Forbidden => StatusCodes.Status403Forbidden,
        ErrorKind.NotFound => StatusCodes.Status404NotFound,
        ErrorKind.Conflict => StatusCodes.Status409Conflict,
        ErrorKind.TooManyRequests => StatusCodes.Status429TooManyRequests,
        ErrorKind.Unavailable => StatusCodes.Status503ServiceUnavailable,
        _ => StatusCodes.Status500InternalServerError,
    };
}
