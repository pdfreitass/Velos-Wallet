using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace Velos.Api.Configuration;

/// <summary>
/// CSP do app (achado SEC-004 da auditoria de 2026-10-17).
///
/// O <c>script-src</c> é <c>'self'</c> mais o hash de cada script embutido no <c>index.html</c>
/// servido — hoje só o do tema, que precisa rodar antes da primeira pintura para não piscar.
///
/// O hash é calculado <b>no arranque, a partir do arquivo servido</b>, e nunca escrito à mão: o
/// repositório guarda o HTML com <c>LF</c> e o checkout no Windows traz <c>CRLF</c>
/// (<c>core.autocrlf</c>), e o hash dos dois é diferente. Um valor fixo funcionaria na máquina de
/// quem escreveu e bloquearia o script no build do CI, sem erro visível: o app abriria no tema
/// errado e só se notaria olhando.
/// </summary>
public static partial class ContentSecurityPolicy
{
    /// <summary>
    /// Diretivas que não dependem do HTML.
    ///
    /// <c>style-src</c> aceita <c>'unsafe-inline'</c> porque o React escreve atributos
    /// <c>style</c> (a largura da barra de progresso das metas) e o Base UI posiciona os popups
    /// assim. É o risco menor da família: estilo embutido não executa código, ao contrário de
    /// script. <c>connect-src 'self'</c> basta porque o front só fala com a própria API
    /// (ADR 0013) — nunca com o Supabase direto.
    /// </summary>
    private static readonly string[] Directives =
    [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "connect-src 'self'",
        // PWA da spec 009: o service worker e o manifest vêm da mesma origem.
        "worker-src 'self'",
        "manifest-src 'self'",
    ];

    /// <summary>
    /// Monta a política. <paramref name="indexHtml"/> é o conteúdo do <c>index.html</c> servido, ou
    /// <c>null</c> quando não há SPA para servir (em desenvolvimento o Vite serve o front, e a API
    /// só responde JSON). Sem HTML, o <c>script-src</c> fica em <c>'self'</c>.
    /// </summary>
    public static string Build(string? indexHtml)
    {
        var scriptSrc = new StringBuilder("script-src 'self'");
        foreach (var hash in InlineScriptHashes(indexHtml))
        {
            scriptSrc.Append(" '").Append(hash).Append('\'');
        }

        return string.Join("; ", Directives.Append(scriptSrc.ToString()));
    }

    /// <summary>
    /// Hash de cada <c>&lt;script&gt;</c> sem <c>src</c>, sobre o UTF-8 do texto de dentro da tag.
    ///
    /// As quebras de linha entram <b>sempre como <c>LF</c></b>, porque é isso que o navegador
    /// compara: o parser de HTML normaliza <c>CRLF</c> e <c>CR</c> para <c>LF</c> antes de o texto
    /// chegar ao script. Sem normalizar, a API no Windows manda o hash do arquivo com <c>CRLF</c>,
    /// o navegador calcula o do mesmo script com <c>LF</c>, e o script é bloqueado — foi o que
    /// aconteceu no primeiro teste, com o app abrindo no tema errado.
    /// </summary>
    private static IEnumerable<string> InlineScriptHashes(string? indexHtml)
    {
        if (string.IsNullOrEmpty(indexHtml)) yield break;

        foreach (var match in InlineScript().Matches(indexHtml).Cast<Match>())
        {
            var body = match.Groups["body"].Value
                .Replace("\r\n", "\n", StringComparison.Ordinal)
                .Replace('\r', '\n');

            yield return $"sha256-{Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(body)))}";
        }
    }

    /// <summary>Só os embutidos: <c>&lt;script src=…&gt;</c> é coberto por <c>'self'</c>.</summary>
    [GeneratedRegex("""<script(?![^>]*\ssrc=)[^>]*>(?<body>.*?)</script>""", RegexOptions.Singleline | RegexOptions.IgnoreCase)]
    private static partial Regex InlineScript();
}
