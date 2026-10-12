using Microsoft.EntityFrameworkCore;
using Npgsql;
using Velos.Infrastructure.Persistence;

namespace Velos.Infrastructure.IntegrationTests;

/// <summary>
/// RLS pela API (plano da spec 001, Revisão 2), contra o banco real do Supabase.
/// Só leitura: nenhum teste grava nada.
/// </summary>
public class UserDbSessionTests
{
    [DatabaseFact]
    public async Task Login_role_without_session_is_denied()
    {
        await using var db = TestDatabase.CreateContext();

        var error = await Assert.ThrowsAsync<PostgresException>(() => CountProfilesAsync(db, default));

        Assert.Equal(PostgresErrorCodes.InsufficientPrivilege, error.SqlState);
    }

    [DatabaseFact]
    public async Task Anon_session_sees_no_profiles()
    {
        await using var db = TestDatabase.CreateContext();
        var session = new UserDbSession(db, FakeUserContext.Anonymous);

        Assert.Equal(0, await session.AsAnonAsync(CountProfilesAsync));
    }

    [DatabaseFact]
    public async Task User_session_for_unknown_user_sees_no_profiles()
    {
        await using var db = TestDatabase.CreateContext();
        var session = new UserDbSession(db, new FakeUserContext(Guid.NewGuid()));

        Assert.Equal(0, await session.AsUserAsync(CountProfilesAsync));
    }

    [DatabaseFact(RequiresTestUser = true)]
    public async Task User_session_sees_only_own_profile()
    {
        var userId = TestDatabase.TestUserId!.Value;
        await using var db = TestDatabase.CreateContext();
        var session = new UserDbSession(db, new FakeUserContext(userId));

        var ids = await session.AsUserAsync((d, ct) =>
            d.Database.SqlQuery<Guid>($"select id as \"Value\" from public.profiles").ToListAsync(ct));

        Assert.Equal([userId], ids);
    }

    [DatabaseFact]
    public async Task Role_and_claims_end_with_the_transaction()
    {
        await using var db = TestDatabase.CreateContext();
        // Mantém a MESMA conexão física: sem isso o pool do Npgsql faria DISCARD ALL ao
        // devolvê-la, e o teste passaria mesmo com set_config(..., false).
        await db.Database.OpenConnectionAsync();
        var session = new UserDbSession(db, new FakeUserContext(Guid.NewGuid()));

        var roleInside = await session.AsUserAsync(CurrentRoleAsync);

        Assert.Equal("authenticated", roleInside);
        Assert.Equal("velos_api", await CurrentRoleAsync(db, default));
        Assert.Equal(string.Empty, await CurrentClaimsAsync(db, default));
    }

    [DatabaseFact]
    public async Task Failure_inside_the_session_rolls_back_and_resets_the_role()
    {
        await using var db = TestDatabase.CreateContext();
        await db.Database.OpenConnectionAsync();
        var session = new UserDbSession(db, new FakeUserContext(Guid.NewGuid()));

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            session.AsUserAsync<int>((_, _) => throw new InvalidOperationException("falha simulada")));

        Assert.Equal("velos_api", await CurrentRoleAsync(db, default));
    }

    [Fact]
    public async Task User_session_without_authenticated_user_is_refused()
    {
        // Não abre conexão: a recusa acontece antes de qualquer acesso ao banco.
        await using var db = new VelosDbContext(
            new DbContextOptionsBuilder<VelosDbContext>().UseNpgsql("Host=invalid").Options);
        var session = new UserDbSession(db, FakeUserContext.Anonymous);

        await Assert.ThrowsAsync<InvalidOperationException>(() => session.AsUserAsync(CountProfilesAsync));
    }

    private static Task<int> CountProfilesAsync(VelosDbContext db, CancellationToken ct) =>
        db.Database.SqlQuery<int>($"select count(*)::int as \"Value\" from public.profiles").SingleAsync(ct);

    private static Task<string> CurrentRoleAsync(VelosDbContext db, CancellationToken ct) =>
        db.Database.SqlQuery<string>($"select current_user::text as \"Value\"").SingleAsync(ct);

    private static Task<string> CurrentClaimsAsync(VelosDbContext db, CancellationToken ct) =>
        db.Database
            .SqlQuery<string>($"select coalesce(current_setting('request.jwt.claims', true), '') as \"Value\"")
            .SingleAsync(ct);
}
