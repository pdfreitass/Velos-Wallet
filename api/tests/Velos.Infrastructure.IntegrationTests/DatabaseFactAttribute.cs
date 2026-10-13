namespace Velos.Infrastructure.IntegrationTests;

/// <summary>
/// Teste que precisa do banco do Supabase. Sem connection string configurada, o teste é
/// PULADO (não falha): `dotnet test` continua passando em qualquer máquina.
/// </summary>
[AttributeUsage(AttributeTargets.Method)]
public sealed class DatabaseFactAttribute : FactAttribute
{
    private bool _requiresTestUser;

    public DatabaseFactAttribute()
    {
        if (TestDatabase.ConnectionString is null)
        {
            Skip = "Sem ConnectionStrings:Velos (dotnet user-secrets ou variável de ambiente).";
        }
    }

    /// <summary>Também precisa de Tests:UserId (id de um usuário real).</summary>
    public bool RequiresTestUser
    {
        get => _requiresTestUser;
        set
        {
            _requiresTestUser = value;
            if (value && Skip is null && TestDatabase.TestUserId is null)
            {
                Skip = "Sem Tests:UserId (dotnet user-secrets).";
            }
        }
    }
}
