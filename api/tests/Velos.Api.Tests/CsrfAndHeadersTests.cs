using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace Velos.Api.Tests;

/// <summary>CSRF por header, resposta de rota inexistente e cabeçalhos de segurança (spec 004, CA11).</summary>
public sealed class CsrfAndHeadersTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Theory]
    [InlineData("POST", "/api/auth/sign-in")]
    [InlineData("PUT", "/api/auth/password")]
    [InlineData("DELETE", "/api/qualquer-coisa")]
    public async Task Mutation_without_the_csrf_header_is_refused(string method, string path)
    {
        using var client = factory.CreateClient();
        using var request = new HttpRequestMessage(new HttpMethod(method), path);

        using var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("csrf_header_missing", body.GetProperty("code").GetString());
    }

    [Fact]
    public async Task Mutation_with_the_csrf_header_gets_past_the_csrf_check()
    {
        using var client = factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Put, "/api/auth/password");
        request.Headers.Add("X-Velos-Csrf", "1");

        using var response = await client.SendAsync(request);

        // Passou do CSRF e parou na autenticação: rota privada, sem sessão.
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Reads_do_not_need_the_csrf_header()
    {
        using var client = factory.CreateClient();

        using var response = await client.GetAsync("/api/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    /// <summary>
    /// Comportamento REAL medido: o Program.cs comenta "404 em JSON (401 sem sessão)". Sem sessão, a
    /// FallbackPolicy responde 401 antes de a rota inexistente virar 404, o que também não revela
    /// quais rotas existem. O que não pode acontecer é devolver o index.html do SPA.
    /// </summary>
    [Fact]
    public async Task Unknown_api_route_without_session_is_401_and_never_html()
    {
        using var client = factory.CreateClient();

        using var response = await client.GetAsync("/api/inexistente");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("<html", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Responses_carry_the_security_headers()
    {
        using var client = factory.CreateClient();

        using var response = await client.GetAsync("/api/health");

        Assert.Equal("nosniff", Single(response, "X-Content-Type-Options"));
        Assert.Equal("DENY", Single(response, "X-Frame-Options"));
        Assert.Contains("frame-ancestors 'none'", Single(response, "Content-Security-Policy"), StringComparison.Ordinal);
        Assert.Equal("same-origin", Single(response, "Referrer-Policy"));
        Assert.Contains("no-store", response.Headers.CacheControl?.ToString(), StringComparison.Ordinal);
    }

    private static string Single(HttpResponseMessage response, string name) =>
        Assert.Single(response.Headers.GetValues(name));
}
