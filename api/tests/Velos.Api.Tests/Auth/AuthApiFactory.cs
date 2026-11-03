using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Velos.Application.Abstractions;
using Velos.Application.Auth;
using Velos.Application.Common;
using Velos.Domain.Auth;

namespace Velos.Api.Tests.Auth;

/// <summary>
/// Sobe a API em memória SEM tocar no banco nem no Supabase: o IIdentityProvider real é trocado por
/// um dublê em memória, configurável por teste. Ambiente "Testing" (não "Development"): assim o
/// dotnet user-secrets, com a connection string real, nunca é carregado.
/// </summary>
internal sealed class AuthApiFactory : WebApplicationFactory<Program>
{
    internal FakeIdentityProvider Identity { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        // UseSetting entra na configuração do host antes de o Program.cs ler a configuração.
        builder.UseSetting("App:PublicOrigin", "http://localhost:3000");
        builder.UseSetting("ConnectionStrings:Velos", "Host=localhost;Database=teste;Username=teste;Password=teste");

        // Depois dos registros do Program: a última implementação vence.
        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<IIdentityProvider>();
            services.AddScoped<IIdentityProvider>(_ => Identity);
        });
    }
}

/// <summary>
/// Supabase de mentira: resultado configurável por teste e registro de cada chamada, para afirmar
/// o que a rota pediu (challenge em vez de verifier, redirect configurado, troca de código).
/// </summary>
internal sealed class FakeIdentityProvider : IIdentityProvider
{
    /// <summary>Resultado das chamadas que criam sessão (cadastro, troca do código do link).</summary>
    internal Result<AuthSession> NextResult { get; set; } = Result.Success(Session);

    /// <summary>Resultado das chamadas que só dizem sim ou não (envio de email).</summary>
    internal Result<Unit> NextUnitResult { get; set; } = Result.Ok();

    internal List<string> Calls { get; } = [];

    internal static readonly AuthSession Session = new(
        "access-token-de-teste", "refresh-token-de-teste", 3600,
        new UserIdentity(Guid.Parse("11111111-1111-1111-1111-111111111111"), "pedro@example.com"));

    public Task<Result<AuthSession>> SignInWithPasswordAsync(string email, string password, CancellationToken cancellationToken)
    {
        Calls.Add($"sign-in:{email}");
        return Task.FromResult(NextResult);
    }

    public Task<Result<AuthSession>> SignUpAsync(
        string name, string email, string password, string? codeChallenge, string? redirectTo, CancellationToken cancellationToken)
    {
        // A senha NÃO entra no registro: nem num dublê de teste ela deve ficar guardada.
        Calls.Add($"sign-up:{name}|{email}|{codeChallenge ?? "sem-challenge"}|{redirectTo ?? "sem-redirect"}");
        return Task.FromResult(NextResult);
    }

    public Task<Result<Unit>> SendSignupConfirmationAsync(
        string email, string codeChallenge, string redirectTo, CancellationToken cancellationToken)
    {
        Calls.Add($"signup-resend:{email}|{codeChallenge}|{redirectTo}");
        return Task.FromResult(NextUnitResult);
    }

    public Task<Result<AuthSession>> RefreshAsync(string refreshToken, CancellationToken cancellationToken) =>
        Task.FromResult(NextResult);

    public Task SignOutAsync(string accessToken, CancellationToken cancellationToken)
    {
        Calls.Add("sign-out");
        return Task.CompletedTask;
    }

    public Task<Result<Unit>> SendPasswordResetAsync(
        string email, string codeChallenge, string redirectTo, CancellationToken cancellationToken)
    {
        Calls.Add($"recover:{email}|{codeChallenge}|{redirectTo}");
        return Task.FromResult(NextUnitResult);
    }

    public Task<Result<AuthSession>> ExchangeCodeAsync(string code, string codeVerifier, CancellationToken cancellationToken)
    {
        Calls.Add($"exchange:{code}|{codeVerifier}");
        return Task.FromResult(NextResult);
    }

    public Task<Result<Unit>> UpdatePasswordAsync(string accessToken, string newPassword, CancellationToken cancellationToken)
    {
        Calls.Add("update-password");
        return Task.FromResult(NextUnitResult);
    }

    public Uri BuildGoogleAuthorizeUrl(string codeChallenge, string redirectTo)
    {
        Calls.Add($"authorize:{codeChallenge}|{redirectTo}");
        return new Uri(
            $"https://projeto.supabase.co/auth/v1/authorize?provider=google"
            + $"&redirect_to={Uri.EscapeDataString(redirectTo)}&code_challenge={codeChallenge}");
    }
}
