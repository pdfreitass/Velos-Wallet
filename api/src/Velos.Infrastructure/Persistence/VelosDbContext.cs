using Microsoft.EntityFrameworkCore;

namespace Velos.Infrastructure.Persistence;

/// <summary>
/// Mapeia o schema que já existe no Supabase. O EF Core NÃO gera migrations:
/// o schema muda só por SQL em supabase/migrations/ (ADR 0012 e 0013).
/// Use sempre por meio da <see cref="UserDbSession"/>: o role de login sozinho não tem acesso a nada.
/// </summary>
public sealed class VelosDbContext(DbContextOptions<VelosDbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder) =>
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(VelosDbContext).Assembly);
}
