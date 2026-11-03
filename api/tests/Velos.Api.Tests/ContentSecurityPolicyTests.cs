using Velos.Api.Configuration;

namespace Velos.Api.Tests;

/// <summary>
/// CSP do SEC-004. O que estes testes protegem é a razão de o hash ser calculado e não escrito:
/// o mesmo script com <c>LF</c> e com <c>CRLF</c> tem hashes diferentes, e o repositório guarda
/// <c>LF</c> enquanto o checkout no Windows traz <c>CRLF</c>.
/// </summary>
public sealed class ContentSecurityPolicyTests
{
    private const string ThemeScript = """
        <!doctype html>
        <html>
          <head>
            <script>document.documentElement.classList.toggle("dark", true);</script>
            <script type="module" src="/assets/index.js"></script>
          </head>
        </html>
        """;

    [Fact]
    public void Sem_html_o_script_src_fica_so_em_self()
    {
        var policy = ContentSecurityPolicy.Build(null);

        Assert.Contains("script-src 'self'", policy, StringComparison.Ordinal);
        Assert.DoesNotContain("sha256-", policy, StringComparison.Ordinal);
    }

    [Fact]
    public void Script_embutido_entra_como_hash_e_o_externo_nao()
    {
        var policy = ContentSecurityPolicy.Build(ThemeScript);

        // Um hash só: o <script src=…> é coberto por 'self'.
        Assert.Single(policy.Split("sha256-")[1..]);
        Assert.Contains("script-src 'self' 'sha256-", policy, StringComparison.Ordinal);
    }

    /// <summary>
    /// O parser de HTML do navegador normaliza <c>CRLF</c> para <c>LF</c> antes de o texto chegar ao
    /// script, então o hash tem de ser o mesmo nos dois. Sem isto, a API no Windows manda um hash e
    /// o navegador calcula outro: o script do tema é bloqueado e o app abre no tema errado.
    /// </summary>
    [Fact]
    public void Hash_ignora_o_tipo_de_quebra_de_linha_do_arquivo()
    {
        const string comLf = "<script>\nvar a = 1;\n</script>";
        var comCrlf = comLf.Replace("\n", "\r\n", StringComparison.Ordinal);
        var comCr = comLf.Replace('\n', '\r');

        var esperado = ContentSecurityPolicy.Build(comLf);

        Assert.Equal(esperado, ContentSecurityPolicy.Build(comCrlf));
        Assert.Equal(esperado, ContentSecurityPolicy.Build(comCr));
    }

    /// <summary>O hash tem de bater com o que o navegador calcula (medido no Chrome, 2026-11-01).</summary>
    [Fact]
    public void Hash_bate_com_o_que_o_navegador_calcula()
    {
        var policy = ContentSecurityPolicy.Build("<script>\nvar a = 1;\n</script>");

        Assert.Contains(
            $"sha256-{Convert.ToBase64String(System.Security.Cryptography.SHA256.HashData("\nvar a = 1;\n"u8.ToArray()))}",
            policy,
            StringComparison.Ordinal);
    }

    [Theory]
    [InlineData("default-src 'self'")]
    [InlineData("frame-ancestors 'none'")]
    [InlineData("object-src 'none'")]
    [InlineData("base-uri 'self'")]
    [InlineData("form-action 'self'")]
    [InlineData("connect-src 'self'")]
    // PWA da spec 009.
    [InlineData("worker-src 'self'")]
    [InlineData("manifest-src 'self'")]
    public void Politica_tem_as_diretivas_do_sec_004(string diretiva)
    {
        Assert.Contains(diretiva, ContentSecurityPolicy.Build(ThemeScript), StringComparison.Ordinal);
    }

    [Fact]
    public void Estilo_embutido_e_permitido_mas_script_embutido_nao()
    {
        var policy = ContentSecurityPolicy.Build(ThemeScript);

        // O React escreve atributos style (a barra de progresso) e o Base UI posiciona popups assim.
        Assert.Contains("style-src 'self' 'unsafe-inline'", policy, StringComparison.Ordinal);
        // Já em script, 'unsafe-inline' abriria a porta que o hash existe para fechar.
        Assert.DoesNotContain("script-src 'self' 'unsafe-inline'", policy, StringComparison.Ordinal);
    }
}
