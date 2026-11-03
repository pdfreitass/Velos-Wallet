using System.Net;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;

namespace Velos.Api.Configuration;

/// <summary>
/// O que só existe atrás de um proxy, em produção (spec 011, RN3 e RN4). Em desenvolvimento nada
/// disto vale: o Kestrel atende direto e as chaves podem ficar no perfil do usuário.
/// </summary>
public static class ProductionSetup
{
    /// <summary>
    /// RN3: persiste as chaves que protegem o cookie de sessão e os cookies do fluxo de
    /// recuperação. Sem isto, cada arranque gera chave nova e **todo cookie anterior deixa de ser
    /// decifrável**: um redeploy desloga todo mundo e quebra os links de recuperação em andamento.
    /// Confirmado na prática em 2026-11-02, reiniciando a API em dev.
    ///
    /// O caminho vem de <c>DataProtection:KeysPath</c> (no Fly, um volume montado em /data).
    /// Sem a configuração, não mexe em nada e o padrão do ASP.NET continua valendo — que é o que
    /// se quer em dev e nos testes.
    /// </summary>
    public static IServiceCollection AddVelosDataProtection(
        this IServiceCollection services, IConfiguration configuration)
    {
        var keysPath = configuration["DataProtection:KeysPath"];
        if (string.IsNullOrWhiteSpace(keysPath)) return services;

        Directory.CreateDirectory(keysPath);
        services.AddDataProtection()
            .PersistKeysToFileSystem(new DirectoryInfo(keysPath))
            // Sem um nome fixo, o ASP.NET usa o caminho do conteúdo da aplicação para isolar as
            // chaves. Esse caminho pode mudar entre imagens, e aí as chaves antigas não seriam
            // aceitas mesmo estando no volume.
            .SetApplicationName("velos-wallet");

        return services;
    }

    /// <summary>
    /// RN4: aceita <c>X-Forwarded-For</c> e <c>X-Forwarded-Proto</c> **só** do proxy à frente da
    /// aplicação. Sem isto, o limite por IP (<see cref="RateLimitingSetup"/>) vê sempre o IP do
    /// proxy — vira um limite global, e um único atacante tranca todo mundo.
    ///
    /// Confiar sem restrição seria pior: qualquer um mandaria um <c>X-Forwarded-For</c> forjado e
    /// escaparia do limite trocando o valor a cada tentativa.
    ///
    /// No Fly, quem fala com a aplicação é o proxy dele, na rede privada da organização
    /// (<c>fdaa::/16</c>). <c>ForwardLimit = 1</c> faz ler só o salto mais próximo.
    /// </summary>
    public static IServiceCollection AddVelosForwardedHeaders(this IServiceCollection services) =>
        services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
            options.ForwardLimit = 1;

            // O padrão traz o loopback; aqui quem manda é a rede privada do Fly, e mais nada.
            options.KnownIPNetworks.Clear();
            options.KnownProxies.Clear();
            // Qualificado: há um IPNetwork obsoleto em Microsoft.AspNetCore.HttpOverrides.
            options.KnownIPNetworks.Add(new System.Net.IPNetwork(IPAddress.Parse("fdaa::"), 16));
        });
}
