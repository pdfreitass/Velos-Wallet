namespace Velos.Infrastructure.Supabase;

/// <param name="Url">URL do projeto, ex.: https://khvottmyspapwsdeqqnm.supabase.co</param>
/// <param name="PublishableKey">
/// Chave publicável (<c>sb_publishable_…</c>). Não é segredo, mas fica só no servidor:
/// o navegador nunca fala direto com o Supabase (ADR 0013).
/// </param>
public sealed record SupabaseSettings(Uri Url, string PublishableKey)
{
    internal Uri AuthBaseAddress => new($"{Url.AbsoluteUri.TrimEnd('/')}/auth/v1/");
}
