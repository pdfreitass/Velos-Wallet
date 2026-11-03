using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace Velos.Api.Tests.Auth;

/// <summary>
/// RN7 da spec 013: as duas rotas novas entram no limite Auth (10 por minuto por IP). Cada teste
/// ganha uma instância própria da API para o balde do limite começar vazio — o limite é por IP, e
/// o servidor de teste responde sempre do mesmo endereço.
/// </summary>
public class SignUpConfirmationRateLimitTests
{
    private const string ResendPath = "/api/auth/sign-up/resend";
    private const string ConfirmPath = "/auth/confirmar-cadastro";

    [Fact]
    public async Task Resend_is_rate_limited_per_ip()
    {
        using var app = new AuthTestApp();

        for (var i = 0; i < 10; i++)
        {
            using var accepted = await app.PostJsonAsync(ResendPath, new { email = $"pedro{i}@example.com" });
            Assert.Equal(HttpStatusCode.Accepted, accepted.StatusCode);
        }

        using var limited = await app.PostJsonAsync(ResendPath, new { email = "pedro@example.com" });

        Assert.Equal(HttpStatusCode.TooManyRequests, limited.StatusCode);
        var body = await limited.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("rate_limited", body.GetProperty("code").GetString());
    }

    [Fact]
    public async Task Confirm_sign_up_callback_is_rate_limited_per_ip()
    {
        using var app = new AuthTestApp();

        for (var i = 0; i < 10; i++)
        {
            using var redirected = await app.Client.GetAsync($"{ConfirmPath}?code=code-{i}");
            Assert.Equal(HttpStatusCode.Redirect, redirected.StatusCode);
        }

        using var limited = await app.Client.GetAsync($"{ConfirmPath}?code=code-final");

        Assert.Equal(HttpStatusCode.TooManyRequests, limited.StatusCode);
        var body = await limited.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("rate_limited", body.GetProperty("code").GetString());
    }
}
