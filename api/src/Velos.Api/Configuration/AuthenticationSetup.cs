using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;

namespace Velos.Api.Configuration;

public static class AuthenticationSetup
{
    /// <summary>
    /// Valida o JWT emitido pelo Supabase Auth e torna TODA rota privada por padrão
    /// (ADR 0013; ADR 0015 na T21). Rota pública precisa de [AllowAnonymous] explícito.
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
                // T15: ler o token do cookie httpOnly "velos_at" em Events.OnMessageReceived.
            });

        services
            .AddAuthorizationBuilder()
            .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build());

        return services;
    }
}
