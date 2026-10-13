using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Velos.Application.Abstractions;
using Velos.Infrastructure.Persistence;
using Velos.Infrastructure.Supabase;

namespace Velos.Infrastructure;

public static class DependencyInjection
{
    /// <param name="connectionString">
    /// Conexão do role <c>velos_api</c> pelo pooler de sessão do Supabase. Vem do
    /// <c>dotnet user-secrets</c> (dev) ou de variável de ambiente (produção), nunca de arquivo versionado.
    /// </param>
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services, string connectionString, SupabaseSettings supabase)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(connectionString);
        ArgumentNullException.ThrowIfNull(supabase);

        services.AddDbContext<VelosDbContext>(options => options.UseNpgsql(connectionString));
        services.AddScoped<UserDbSession>();
        services.AddScoped<ILoginLockout, LoginLockoutStore>();
        services.AddScoped<IProfileReader, ProfileReader>();

        services.AddHttpClient<IIdentityProvider, SupabaseAuthClient>(client =>
        {
            client.BaseAddress = supabase.AuthBaseAddress;
            client.Timeout = TimeSpan.FromSeconds(10);
            client.DefaultRequestHeaders.Add("apikey", supabase.PublishableKey);
            // Pede o formato de erro atual do GoTrue (código em "code").
            client.DefaultRequestHeaders.Add("X-Supabase-Api-Version", "2024-01-01");
        });

        return services;
    }
}
