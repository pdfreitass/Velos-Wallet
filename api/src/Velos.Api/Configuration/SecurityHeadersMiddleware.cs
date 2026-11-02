namespace Velos.Api.Configuration;

public static class SecurityHeadersMiddleware
{
    /// <summary>
    /// Cabeçalhos de segurança em toda resposta (API e o SPA servido em produção), achado S6 da T23:
    /// nenhum site de terceiro embute o app num iframe (clickjacking em /redefinir-senha e, depois,
    /// nas telas financeiras), o navegador não "adivinha" tipo de arquivo e o endereço não vaza no
    /// Referer para outros sites. HSTS fica no Program.cs, só fora de Development.
    /// </summary>
    /// <param name="contentSecurityPolicy">
    /// A política pronta, de <see cref="ContentSecurityPolicy.Build"/>. Vem montada de fora porque
    /// depende do <c>index.html</c> servido e é calculada uma vez, no arranque — não a cada resposta.
    /// </param>
    public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder app, string contentSecurityPolicy)
    {
        ArgumentException.ThrowIfNullOrEmpty(contentSecurityPolicy);

        return app.Use(async (context, next) =>
        {
            var headers = context.Response.Headers;
            headers.XContentTypeOptions = "nosniff";
            headers.XFrameOptions = "DENY";
            headers.ContentSecurityPolicy = contentSecurityPolicy;
            headers["Referrer-Policy"] = "same-origin";

            await next(context);
        });
    }
}
