namespace Velos.Application.Common;

/// <summary>
/// RN7 da spec 001: o "voltar para onde eu ia" só aceita caminhos INTERNOS do app.
/// Sem isso, <c>/entrar?next=https://site-falso.com</c> levaria o usuário, já logado,
/// para fora do app (open redirect, base de phishing). Mesma regra de
/// <c>web/src/lib/utils/redirect.ts</c>.
/// </summary>
public static class SafeRedirect
{
    /// <summary>Destino depois de entrar e fallback de todo redirecionamento.</summary>
    public const string DefaultPath = "/painel";

    private static readonly Uri InternalOrigin = new("http://velos.internal");

    public static string Resolve(string? next, string fallback = DefaultPath)
    {
        // Recusa tudo o que o navegador trataria como outro domínio: "https://x.com", "//x.com",
        // "/\x.com" e caracteres de controle ("/\t/x.com" vira "//x.com" no parser do navegador).
        if (string.IsNullOrEmpty(next) || next[0] != '/' || LooksExternal(next) || next.Any(char.IsControl))
        {
            return fallback;
        }

        if (!Uri.TryCreate(InternalOrigin, next, out var url) || url.Host != InternalOrigin.Host)
        {
            return fallback;
        }

        // Confere de novo DEPOIS de normalizar: "/..//x.com" passa na checagem acima, mas o parser
        // remove o ".." e sobra "//x.com" (o mesmo vale para "/.//x.com" e "/%2e%2e//x.com").
        var resolved = url.PathAndQuery + url.Fragment;
        return LooksExternal(resolved) ? fallback : resolved;
    }

    private static bool LooksExternal(string path) =>
        path.StartsWith("//", StringComparison.Ordinal) || path.StartsWith("/\\", StringComparison.Ordinal);
}
