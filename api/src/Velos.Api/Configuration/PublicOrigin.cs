namespace Velos.Api.Configuration;

/// <summary>
/// Endereço público do app (configuração <c>App:PublicOrigin</c>), usado para montar os endereços de
/// volta do Google (<c>/auth/callback</c>) e do email de recuperação (<c>/auth/confirm</c>).
///
/// NUNCA derivar do <c>Host</c> da request: ele pode ser forjado, e atrás do proxy TLS de produção o
/// esquema chega como <c>http</c>. Com PKCE, quem inicia o fluxo guarda o verifier, então um link de
/// recuperação envenenado com o domínio de um atacante valeria a conta inteira da vítima, bastando
/// alguém afrouxar as Redirect URLs do Supabase com um curinga de host (achado S1 da T23).
/// </summary>
public sealed class PublicOrigin
{
    private readonly Uri origin;

    public PublicOrigin(Uri origin)
    {
        ArgumentNullException.ThrowIfNull(origin);
        if (!origin.IsAbsoluteUri || origin.AbsolutePath != "/" || origin.Query.Length > 0)
        {
            throw new ArgumentException("App:PublicOrigin deve ser só esquema + host (ex.: https://app.exemplo.com).", nameof(origin));
        }

        this.origin = origin;
    }

    /// <summary>Endereço absoluto para um caminho do app (ex.: <c>/auth/confirm</c>).</summary>
    public string Url(string pathAndQuery) => new Uri(origin, pathAndQuery).AbsoluteUri;
}
