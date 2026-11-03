# Plan 011 — Deploy em produção

> **COMO**, tecnicamente. O **o quê** está na [spec.md](spec.md).

- **Status:** Aprovado
- **Data:** 2026-11-02
- **Decisão de fundo:** [ADR 0020](../../adr/0020-host-fly-io-gru.md)

## A forma da coisa

Um container, uma máquina, uma origem:

```
                    veloswallet.com.br
                            │  (A/AAAA → Fly)
                    ┌───────▼────────┐
                    │  proxy do Fly  │  TLS, força HTTPS
                    └───────┬────────┘
                            │  X-Forwarded-For / -Proto (rede fdaa::/16)
            ┌───────────────▼────────────────┐
            │  máquina (gru) — porta 8080    │
            │  ┌──────────────────────────┐  │
            │  │  Velos.Api (.NET 10)     │  │
            │  │   /api/**  → controllers │  │
            │  │   outras   → wwwroot/    │  │  ← build do Vite
            │  └──────────────────────────┘  │
            │  volume velos_keys → /data     │  ← chaves do Data Protection
            └───────────────┬────────────────┘
                            │
                     Supabase (sa-east-1)
```

## Os arquivos

### `Dockerfile` — três estágios

1. **`web`** (`node:24-alpine`): `npm ci` e `npm run build`. O lockfile é copiado antes do resto para o `npm ci` ficar numa camada própria. Como o `build` é `tsc -b && vite build`, **o deploy quebra se os tipos quebrarem** — é uma trava de graça.
2. **`api`** (`sdk:10.0-alpine`): os `.csproj` primeiro, `dotnet restore`, depois o código e `dotnet publish -c Release`. O `dist/` do estágio anterior entra como `wwwroot` **depois** do publish, para mexer no front não invalidar a camada da API.
3. **`final`** (`aspnet:10.0-alpine`): só o publicado. Roda como `app` (RN8), expõe 8080.

O `/data/keys` é criado e entregue ao `app` ainda na imagem: o volume do Fly monta por cima, e sem isso o processo sem privilégio não conseguiria escrever lá.

### `.dockerignore`

Fora `node_modules`, `bin`, `obj`, `docs`, `supabase`, testes, e qualquer `appsettings.Development.json`, `.env` ou `.pfx`. Além de acelerar, é rede de segurança: **o que não entra no contexto não pode acabar dentro da imagem** (RN7).

### `fly.toml`

- `primary_region = "gru"`, `internal_port = 8080`, `force_https = true`.
- `[env]` com o que **não é segredo**: `App__PublicOrigin`, `AllowedHosts`, `DataProtection__KeysPath`, `ASPNETCORE_ENVIRONMENT`.
- `auto_stop_machines = false` e `min_machines_running = 1`: o app é de uso pessoal, acessado poucas vezes por dia, e o arranque a frio seria a regra, não a exceção.
- `[[mounts]]` do volume `velos_keys` em `/data`.
- Health check em **`/api/health`**. Não em `/health`: qualquer rota fora de `/api` cai no `MapFallbackToFile` e devolve o `index.html` com **200**, então um check em `/health` passaria com a API quebrada. Conferido.

### `ProductionSetup.cs` — o que faltava na API

**`AddVelosDataProtection`** (RN3): lê `DataProtection:KeysPath` e, se existir, persiste as chaves ali com `SetApplicationName("velos-wallet")`. O nome fixo importa: sem ele o ASP.NET isola as chaves pelo caminho do conteúdo da aplicação, que muda entre imagens — as chaves estariam no volume e mesmo assim não seriam aceitas. **Sem a configuração a função não faz nada**, que é o que se quer em dev e nos testes.

**`AddVelosForwardedHeaders`** (RN4): aceita `X-Forwarded-For` e `-Proto` com `ForwardLimit = 1`, e limpa `KnownProxies`/`KnownIPNetworks` para deixar **só** `fdaa::/16`, a rede privada do Fly. Confiar sem restrição seria pior do que não confiar: qualquer um forjaria o cabeçalho e escaparia do limite por IP trocando o valor a cada tentativa.

O `app.UseForwardedHeaders()` é **o primeiro** do pipeline — o resto precisa de ver o IP e o esquema do cliente, não os do proxy.

> No .NET 10, `KnownNetworks` e `Microsoft.AspNetCore.HttpOverrides.IPNetwork` estão obsoletos e o projeto trata aviso como erro. São `KnownIPNetworks` e `System.Net.IPNetwork`, qualificado por haver duas classes com o mesmo nome.

## Os segredos (RN1)

Por `fly secrets set`, nunca em arquivo:

| Secret | De onde sai |
|---|---|
| `ConnectionStrings__Velos` | a mesma de dev, mas com **`SSL Mode=VerifyFull`** (RN2) |

O `Supabase:Url` e a `PublishableKey` já estão no `appsettings.json` e **podem continuar lá**: a chave publicável é feita para ser pública, e a Data API está desligada.

## O que não dá para fazer sem a conta

O Pedro ainda não tem conta no Fly, e o `flyctl` não está instalado nesta máquina. Então o que é código e configuração fica pronto e commitado, e a execução espera. A sequência, quando a conta existir:

```bash
fly auth login
fly launch --no-deploy            # usa o fly.toml existente
fly volumes create velos_keys --region gru --size 1
fly secrets set ConnectionStrings__Velos="..."
fly deploy
fly certs add veloswallet.com.br  # e os registros A/AAAA no Registro.br
```

Depois: as URLs de redirect no Supabase Auth (`https://veloswallet.com.br/auth/confirm` e `/auth/callback**`, **exatas, sem curinga de host**) e o Google OAuth.

## Riscos

| Risco | Mitigação |
|---|---|
| O Dockerfile só falhar na hora do deploy | **Construir a imagem localmente antes** — o Docker está instalado |
| O volume não ser montado e o `/data/keys` cair no sistema de arquivos efêmero | Conferir depois do primeiro deploy que o redeploy **não** desloga (CA3) |
| `AllowedHosts` com o domínio quebrar o health check, que chega por IP interno | O check do Fly vai ao `internal_port` com `Host` da máquina; se recusar, somar `.internal` ao `AllowedHosts` |
| Segredo acabar na imagem | `.dockerignore` + CA8 |

## Testes

Os 359 testes da API continuam a valer e não mudam. O que esta spec entrega não tem teste automatizado: é configuração, e prova-se no ar, pelos critérios de aceite.
