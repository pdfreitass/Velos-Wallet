using Velos.Application.Common;

namespace Velos.Application.Tests.Common;

/// <summary>RN7 / CA9 da spec 001: nunca redirecionar para fora do app.</summary>
public class SafeRedirectTests
{
    [Theory]
    [InlineData("/painel", "/painel")]
    [InlineData("/transacoes?mes=2026-10", "/transacoes?mes=2026-10")]
    [InlineData("/metas#nova", "/metas#nova")]
    [InlineData("/contas/1?a=b&c=d", "/contas/1?a=b&c=d")]
    public void Internal_paths_are_kept(string next, string expected)
    {
        Assert.Equal(expected, SafeRedirect.Resolve(next));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("https://site-malicioso.com")]
    [InlineData("http://site-malicioso.com")]
    [InlineData("//site-malicioso.com")]
    [InlineData("/\\site-malicioso.com")]
    [InlineData("/\t/site-malicioso.com")]
    [InlineData("/\n/site-malicioso.com")]
    [InlineData("javascript:alert(1)")]
    [InlineData("site-malicioso.com")]
    [InlineData(" /painel")]
    public void Anything_that_could_leave_the_app_falls_back_to_the_panel(string? next)
    {
        Assert.Equal(SafeRedirect.DefaultPath, SafeRedirect.Resolve(next));
    }

    [Fact]
    public void Custom_fallback_is_used()
    {
        Assert.Equal("/entrar", SafeRedirect.Resolve("//x.com", "/entrar"));
    }
}
