using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Velos.Api.Auth;

namespace Velos.Api.Configuration;

public static class AuthenticationSetup
{
    /// <summary>
    /// Valida o JWT emitido pelo Supabase Auth e torna TODA rota privada por padrão
    /// (ADR 0013, ADR 0015). Rota pública precisa de [AllowAnonymous] explícito.
    /// </summary>
    public static IServiceCollection AddVelosAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var supabaseUrl = configuration["Supabase:Url"]
            ?? throw new InvalidOperationException("Configuração 'Supabase:Url' ausente.");

        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                // O projeto assina com ES256: a chave pública vem do OpenID Discovery
                // ({Authority}/.well-known/openid-configuration), sem segredo guardado aqui.
                options.Authority = $"{supabaseUrl.TrimEnd('/')}/auth/v1";
                options.Audience = "authenticated";
                // Mantém os nomes do JWT ("sub", "email"); sem isso o .NET os renomeia.
                options.MapInboundClaims = false;
                // O token vem SÓ do cookie httpOnly (ou do token renovado nesta request), nunca do
                // header Authorization: o navegador não tem acesso a ele.
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        context.Token = SessionCookies.ReadAccessToken(context.HttpContext);
                        return Task.CompletedTask;
                    },
                };
            });

        services
            .AddAuthorizationBuilder()
            .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build());

        return services;
    }
}
