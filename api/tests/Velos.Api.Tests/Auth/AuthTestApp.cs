using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Net.Http.Headers;

namespace Velos.Api.Tests.Auth;

/// <summary>
/// API de teste + client configurado para os testes de auth: NÃO segue redirects (os 302 são o que
/// se testa) e NÃO guarda cookies sozinho — cada cookie é lido e reenviado à mão, para afirmar o
/// valor e os atributos (httpOnly, Secure, SameSite, Max-Age, expiração) de cada um.
/// </summary>
internal sealed class AuthTestApp : IDisposable
{
    internal const string CsrfHeader = "X-Velos-Csrf";

    internal AuthApiFactory Factory { get; }

    internal HttpClient Client { get; }

    internal AuthTestApp()
    {
        Factory = new AuthApiFactory();
        Client = Factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
            HandleCookies = false,
        });
    }

    internal async Task<HttpResponseMessage> PostJsonAsync(string path, object body)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, path)
        {
            Content = JsonContent.Create(body),
        };
        request.Headers.Add(CsrfHeader, "1");
        return await Client.SendAsync(request);
    }

    /// <summary>Primeiro Set-Cookie com o nome dado, ou nulo se a resposta não o definiu.</summary>
    internal static SetCookieHeaderValue? Cookie(HttpResponseMessage response, string name)
    {
        if (!response.Headers.TryGetValues("Set-Cookie", out var values))
        {
            return null;
        }

        return values.Select(value => SetCookieHeaderValue.Parse(value)).FirstOrDefault(cookie => cookie.Name == name);
    }

    internal static HttpRequestMessage GetWithCookie(string path, string name, string value)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, path);
        request.Headers.Add("Cookie", $"{name}={value}");
        return request;
    }

    internal static void AssertRedirect(HttpResponseMessage response, string location)
    {
        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        Assert.Equal(location, response.Headers.Location?.OriginalString);
    }

    /// <summary>Cookie que a resposta apagou: valor vazio e expiração no passado.</summary>
    internal static void AssertExpired(SetCookieHeaderValue? cookie)
    {
        Assert.NotNull(cookie);
        Assert.Equal(string.Empty, cookie!.Value.Value);
        Assert.True(cookie.Expires < DateTimeOffset.UtcNow);
    }

    public void Dispose()
    {
        Client.Dispose();
        Factory.Dispose();
    }
}
