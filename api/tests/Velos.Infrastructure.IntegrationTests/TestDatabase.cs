using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Velos.Infrastructure.Persistence;

namespace Velos.Infrastructure.IntegrationTests;

/// <summary>
/// Configuração dos testes de banco: a mesma connection string da API
/// (dotnet user-secrets da Velos.Api, ou a variável ConnectionStrings__Velos).
/// </summary>
internal static class TestDatabase
{
    private static readonly IConfiguration Configuration = new ConfigurationBuilder()
        .AddUserSecrets(typeof(TestDatabase).Assembly, optional: true)
        .AddEnvironmentVariables()
        .Build();

    public static string? ConnectionString => Configuration.GetConnectionString("Velos");

    /// <summary>Id de um usuário real (Tests:UserId), para provar que ele vê só o próprio perfil.</summary>
    public static Guid? TestUserId =>
        Guid.TryParse(Configuration["Tests:UserId"], out var id) ? id : null;

    public static VelosDbContext CreateContext() =>
        new(new DbContextOptionsBuilder<VelosDbContext>().UseNpgsql(ConnectionString).Options);
}
