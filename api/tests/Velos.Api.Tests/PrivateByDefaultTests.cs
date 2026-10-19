using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;

namespace Velos.Api.Tests;

/// <summary>
/// "Privado por padrão" (ADR 0015) provado, não só lido: a lista de rotas públicas é FIXA aqui.
/// Quem criar um endpoint com [AllowAnonymous] vê este teste falhar e precisa atualizar a lista
/// de propósito. Todo o resto tem de responder 401 sem sessão.
/// </summary>
public sealed class PrivateByDefaultTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    /// <summary>Rotas de controller que podem ser acessadas sem login. Mudar isto é uma decisão de segurança.</summary>
    private static readonly string[] ExpectedPublicRoutes =
    [
        "GET api/health",
        "POST api/auth/sign-up",
        "POST api/auth/sign-in",
        "POST api/auth/sign-out",
        "GET api/auth/google",
        "POST api/auth/password-reset",
        "GET auth/confirm",
        "GET auth/callback",
    ];

    [Fact]
    public void Public_controller_routes_are_exactly_the_expected_list()
    {
        var actual = ControllerEndpoints().Where(e => e.IsAnonymous).Select(e => e.Name).Order().ToArray();

        Assert.Equal(ExpectedPublicRoutes.Order().ToArray(), actual);
    }

    [Fact]
    public async Task Every_other_controller_route_answers_401_without_a_session()
    {
        var privateRoutes = ControllerEndpoints().Where(e => !e.IsAnonymous).ToList();
        // Se a lista ficar vazia, o teste passaria sem provar nada.
        Assert.Contains(privateRoutes, e => e.Name == "GET api/me");

        using var client = factory.CreateClient();
        foreach (var route in privateRoutes)
        {
            using var request = new HttpRequestMessage(new HttpMethod(route.Method), "/" + route.Path);
            request.Headers.Add("X-Velos-Csrf", "1");

            using var response = await client.SendAsync(request);

            Assert.True(
                response.StatusCode == HttpStatusCode.Unauthorized,
                $"{route.Name} deveria exigir login (401), mas respondeu {(int)response.StatusCode}.");
        }
    }

    private List<RouteInfo> ControllerEndpoints() =>
        [.. factory.Services.GetRequiredService<EndpointDataSource>().Endpoints
            .OfType<RouteEndpoint>()
            .Where(e => e.Metadata.GetMetadata<ControllerActionDescriptor>() is not null)
            .SelectMany(e => (e.Metadata.GetMetadata<HttpMethodMetadata>()?.HttpMethods ?? ["?"])
                .Select(method => new RouteInfo(
                    method,
                    e.RoutePattern.RawText!.TrimStart('/'),
                    e.Metadata.GetMetadata<IAllowAnonymous>() is not null)))];

    private sealed record RouteInfo(string Method, string Path, bool IsAnonymous)
    {
        public string Name => $"{Method} {Path}";
    }
}
