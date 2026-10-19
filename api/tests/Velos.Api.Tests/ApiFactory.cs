using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Velos.Api.Tests;

/// <summary>
/// Sobe a API em memória SEM tocar no banco nem no Supabase. Ambiente "Testing" (não "Development"):
/// assim o dotnet user-secrets, com a connection string real, nunca é carregado. As rotas testadas
/// respondem antes de qualquer acesso externo (401, 400 do CSRF, 404).
/// </summary>
public sealed class ApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        // UseSetting entra na configuração do host antes de o Program.cs ler a configuração.
        builder.UseSetting("App:PublicOrigin", "http://localhost:3000");
        builder.UseSetting("ConnectionStrings:Velos", "Host=localhost;Database=teste;Username=teste;Password=teste");
    }
}
