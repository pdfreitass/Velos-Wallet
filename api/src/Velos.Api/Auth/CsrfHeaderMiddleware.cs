namespace Velos.Api.Auth;

/// <summary>
/// Proteção contra CSRF: toda mutação em /api exige o header <c>X-Velos-Csrf: 1</c>. Um formulário
/// ou link de outro site não consegue enviar header customizado, e um fetch de outra origem com esse
/// header é barrado pelo navegador (não há CORS liberado). Soma-se ao SameSite=Lax dos cookies.
/// </summary>
internal sealed class CsrfHeaderMiddleware(RequestDelegate next)
{
    public const string HeaderName = "X-Velos-Csrf";

    public async Task InvokeAsync(HttpContext context, IProblemDetailsService problems)
    {
        var request = context.Request;
        var isMutation = !(HttpMethods.IsGet(request.Method) || HttpMethods.IsHead(request.Method)
            || HttpMethods.IsOptions(request.Method));

        if (isMutation && request.Path.StartsWithSegments("/api") && request.Headers[HeaderName] != "1")
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            await problems.WriteAsync(new ProblemDetailsContext
            {
                HttpContext = context,
                ProblemDetails =
                {
                    Title = "Requisição recusada",
                    Detail = "Requisição sem o cabeçalho de segurança do app.",
                    Extensions = { ["code"] = "csrf_header_missing" },
                },
            });
            return;
        }

        await next(context);
    }
}
