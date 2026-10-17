using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Velos.Application.Auth;

namespace Velos.Api.Configuration;

/// <summary>
/// Limite de requisições por IP nas rotas que chamam o Supabase Auth (achado S2 da T23).
///
/// Por que na API: o Supabase é chamado servidor a servidor, então o limite por IP DELE enxerga um IP
/// só, o da API. Sem este limite, um atacante esgotaria a cota de /token, /signup ou de envio de
/// email e ninguém mais entraria, se cadastraria ou recuperaria a senha. Também freia testar uma
/// senha em muitos emails, que o bloqueio por email (ADR 0014) não pega.
///
/// Em produção o IP só é o do cliente com ForwardedHeaders restrito ao proxy (checklist do deploy).
/// </summary>
public static class RateLimitingSetup
{
    /// <summary>Entrar, criar conta, Google e as voltas dos links: 10 por minuto por IP.</summary>
    public const string Auth = "auth";

    /// <summary>Pedir email de recuperação: 3 a cada 15 minutos por IP (cada um gasta cota de email).</summary>
    public const string PasswordReset = "password-reset";

    /// <summary>Teto geral de qualquer rota /api: 300 por minuto por pessoa (ou por IP, sem sessão).</summary>
    public const int GlobalPermitsPerMinute = 300;

    public static IServiceCollection AddVelosRateLimiting(this IServiceCollection services) =>
        services.AddRateLimiter(options =>
        {
            options.AddPolicy(Auth, context => PerIp(context, permits: 10, TimeSpan.FromMinutes(1)));
            options.AddPolicy(PasswordReset, context => PerIp(context, permits: 3, TimeSpan.FromMinutes(15)));

            // Teto geral de /api (achado SEC-003 da T15): por pessoa (sub do JWT já validado, pois o
            // UseRateLimiter vem depois do UseAuthentication) ou, sem sessão, por IP. Folgado para o uso
            // normal; só segura abuso. As políticas acima continuam valendo por cima deste teto.
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
                context.Request.Path.StartsWithSegments("/api")
                    ? RateLimitPartition.GetFixedWindowLimiter(
                        context.User.FindFirst("sub")?.Value is { } sub
                            ? $"user:{sub}"
                            : $"ip:{context.Connection.RemoteIpAddress}",
                        _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = GlobalPermitsPerMinute, Window = TimeSpan.FromMinutes(1), QueueLimit = 0,
                        })
                    : RateLimitPartition.GetNoLimiter("spa"));

            // Mesmo code e mensagem do limite do Supabase: a tela já sabe mostrar.
            options.OnRejected = async (rejected, cancellationToken) =>
            {
                var http = rejected.HttpContext;
                http.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                if (rejected.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                {
                    http.Response.Headers.RetryAfter = ((int)Math.Ceiling(retryAfter.TotalSeconds)).ToString(System.Globalization.CultureInfo.InvariantCulture);
                }

                var problems = http.RequestServices.GetRequiredService<IProblemDetailsService>();
                await problems.WriteAsync(new ProblemDetailsContext
                {
                    HttpContext = http,
                    ProblemDetails =
                    {
                        Status = StatusCodes.Status429TooManyRequests,
                        Title = "Muitas requisições",
                        Detail = AuthErrors.RateLimited.Message,
                        Extensions = { ["code"] = AuthErrors.RateLimited.Code },
                    },
                });
            };
        });

    /// <summary>
    /// Tentativas de renovar a sessão: 30 por minuto por IP (achado SEC-001 da T15). Uma pessoa
    /// renova cerca de uma vez por hora; a folga é para várias pessoas atrás do mesmo IP (NAT).
    /// Usado direto pelo TokenRefreshMiddleware, que roda antes do roteamento.
    /// </summary>
    public static PartitionedRateLimiter<HttpContext> CreateRefreshLimiter() =>
        PartitionedRateLimiter.Create<HttpContext, string>(context => PerIp(context, permits: 30, TimeSpan.FromMinutes(1)));

    private static RateLimitPartition<string> PerIp(HttpContext context, int permits, TimeSpan window) =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "desconhecido",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = permits, Window = window, QueueLimit = 0 });
}
