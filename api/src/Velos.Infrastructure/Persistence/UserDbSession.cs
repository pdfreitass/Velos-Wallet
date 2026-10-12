using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Velos.Application.Abstractions;
using Velos.Application.Auth;

namespace Velos.Infrastructure.Persistence;

/// <summary>
/// Abre uma transação e assume o papel do Supabase (<c>anon</c> ou <c>authenticated</c>) com os
/// claims do usuário, para que auth.uid(), as policies de RLS e as views com security_invoker
/// valham como no próprio Supabase (ADR 0013, plano da spec 001 — Revisão 2).
/// </summary>
/// <remarks>
/// O role de login (<c>velos_api</c>) é <c>noinherit</c>: fora desta sessão, qualquer query em
/// dado de usuário falha com "permission denied". Não aninhe sessões (uma transação por vez).
/// </remarks>
public sealed class UserDbSession(VelosDbContext db, IUserContext user)
{
    private const string AnonClaims = """{"role":"anon"}""";

    /// <summary>Executa <paramref name="work"/> como o usuário autenticado da request (RLS do usuário).</summary>
    public Task<T> AsUserAsync<T>(
        Func<VelosDbContext, CancellationToken, Task<T>> work,
        CancellationToken cancellationToken = default)
    {
        if (!user.IsAuthenticated)
        {
            throw new InvalidOperationException("Sessão de banco de usuário pedida sem usuário autenticado.");
        }

        return AsUserAsync(new UserIdentity(user.UserId, user.Email), work, cancellationToken);
    }

    /// <summary>
    /// Executa como um usuário que acabou de receber a sessão do Supabase Auth (resposta servidor a
    /// servidor), antes de a request ter cookie. Ex.: zerar as falhas de login logo após entrar.
    /// Nunca use com dados vindos do navegador.
    /// </summary>
    public Task<T> AsUserAsync<T>(
        UserIdentity identity,
        Func<VelosDbContext, CancellationToken, Task<T>> work,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(identity);
        var claims = JsonSerializer.Serialize(new SessionClaims(identity.Id, "authenticated", identity.Email));
        return RunAsync("authenticated", claims, work, cancellationToken);
    }

    /// <summary>Executa <paramref name="work"/> como visitante (antes do login, ex.: bloqueio de tentativas).</summary>
    public Task<T> AsAnonAsync<T>(
        Func<VelosDbContext, CancellationToken, Task<T>> work,
        CancellationToken cancellationToken = default) =>
        RunAsync("anon", AnonClaims, work, cancellationToken);

    private async Task<T> RunAsync<T>(
        string role,
        string claimsJson,
        Func<VelosDbContext, CancellationToken, Task<T>> work,
        CancellationToken cancellationToken)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);

        // is_local = true: os dois valores morrem no fim da transação (commit ou rollback),
        // então a conexão volta limpa ao pool. NUNCA usar false aqui.
        await db.Database.ExecuteSqlAsync(
            $"select set_config('role', {role}, true), set_config('request.jwt.claims', {claimsJson}, true)",
            cancellationToken);

        var result = await work(db, cancellationToken);

        await transaction.CommitAsync(cancellationToken);
        return result;
    }

    /// <summary>
    /// Só o que a RLS e as funções do banco usam: auth.uid() lê "sub" e
    /// clear_my_login_failures() lê "email". Montado a partir do JWT validado.
    /// </summary>
    private sealed record SessionClaims(
        [property: JsonPropertyName("sub")] Guid Sub,
        [property: JsonPropertyName("role")] string Role,
        [property: JsonPropertyName("email")] string? Email);
}
