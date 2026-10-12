namespace Velos.Api.Configuration;

public static class NoStoreMiddleware
{
    /// <summary>
    /// Respostas da API e dos links de autenticação nunca vão para cache: são dados
    /// financeiros privados, e o "voltar" do navegador não pode mostrar nada após o "Sair" (CA11).
    /// </summary>
    public static IApplicationBuilder UseNoStoreForApi(this IApplicationBuilder app) =>
        app.Use(async (context, next) =>
        {
            var path = context.Request.Path;
            if (path.StartsWithSegments("/api") || path.StartsWithSegments("/auth"))
            {
                context.Response.Headers.CacheControl = "no-store";
            }

            await next(context);
        });
}
