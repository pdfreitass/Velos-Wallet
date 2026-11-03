# Tasks 011 — Deploy em produção

> Passos pequenos e verificáveis. Uma task por vez; ao terminar cada uma, parar e mostrar.
> O **o quê** está na [spec.md](spec.md), o **como** no [plan.md](plan.md).

## Prontas (código e configuração)

- [x] **T1 — `Dockerfile`**
  Três estágios: build do front (`node:24-alpine`), build da API (`sdk:10.0-alpine`), imagem final (`aspnet:10.0-alpine`). O `dist/` do Vite entra como `wwwroot`. Roda como `app`, não root (RN8). `/data/keys` criado e com dono certo.

- [x] **T2 — `.dockerignore`**
  Fora `node_modules`, `bin`, `obj`, `docs`, `supabase`, testes, `appsettings.Development.json`, `.env`, `.pfx` (RN7).

- [x] **T3 — `fly.toml`**
  `gru`, porta 8080, `force_https`, volume `velos_keys` em `/data`, `min_machines_running = 1`, health check em **`/api/health`** (não `/health`, que cai no fallback do SPA e devolve 200 com a API quebrada).

- [x] **T4 — `ProductionSetup.cs`**
  `AddVelosDataProtection` (RN3) e `AddVelosForwardedHeaders` (RN4), ligados no `Program.cs`, com o `UseForwardedHeaders` em primeiro no pipeline. Sem configuração, nenhum dos dois faz nada — dev e testes seguem como estavam.
  *Conferido:* `dotnet build api` sem aviso e **359 testes** a passar.

## Por fazer

- [x] **T5 — Construir a imagem localmente** ✅ 2026-11-02
  Imagem de **196 MB**, container a falar com o Supabase real. O que ficou provado:

  | Prova | Resultado |
  |---|---|
  | `/api/health` | `{"status":"ok"}` |
  | `/` | o SPA, servido da mesma origem |
  | `/api/naoexiste` | **401** (rota privada por padrão), não o `index.html` |
  | Usuário do processo (RN8) | `uid=1654(app)`, não root |
  | Chaves no volume (RN3) | `key-1e49….xml`, dono `app`, modo `-rw-------` |
  | **Recriar o container** (RN3/CA3) | **a mesma chave é reutilizada** — o redeploy não desloga ninguém |
  | `AllowedHosts` restrito (RN5/CA7) | Host do domínio → 200; `site-falso.com`, `localhost` e sem Host → **400** |
  | Segredos na imagem (RN7) | nenhum `appsettings` com senha |
  | CSP | completa, com o hash do script de tema tirado do `index.html` servido |
  | Login com senha errada | **400**, resposta de domínio — não 500 de infraestrutura |

  **Achado que teria quebrado o primeiro deploy:** com o `AllowedHosts` restrito ao domínio, o
  health check do Fly — que chega pela rede interna, com o Host do IP da máquina — levaria **400**,
  e a máquina nunca ficaria saudável. Resolvido no `fly.toml` com `[checks.health.headers]`
  mandando `Host = "veloswallet.com.br"`.

- [x] **T6 — Conta e `flyctl`** *(do Pedro)*
  Criar conta no Fly.io (pede cartão, mesmo no plano gratuito) e instalar o `flyctl` — **não está** nesta máquina.

- [x] **T7 — Criar o app, o volume e os segredos**
  ```bash
  fly auth login
  fly launch --no-deploy
  fly volumes create velos_keys --region gru --size 1
  fly secrets set ConnectionStrings__Velos="...SSL Mode=VerifyFull..."
  ```
  A connection string é a de dev com **`SSL Mode=VerifyFull`** (RN2), nunca `Require`.

- [x] **T8 — Primeiro deploy**
  `fly deploy`. *Pronto quando:* o health check fica verde e a URL do Fly abre o app.

- [x] **T9a — Certificado e registros DNS** ✅ 2026-11-02
  `flyctl certs add veloswallet.com.br` feito; na zona do Registro.br entraram, **sem tocar nos três do Resend**:

  | Tipo | Nome | Dados |
  |---|---|---|
  | A | `veloswallet.com.br` | `66.241.124.195` (IPv4 partilhado) |
  | AAAA | `veloswallet.com.br` | `2a09:8280:1::1e0:9be2:0` (IPv6 dedicado) |

  O painel confirmou *"Zona DNS atualizada com sucesso!"*, mas a zona **ainda não publicou** — igual ao que aconteceu com os registros do Resend. Conferir nos **NS reais** (`a.sec.dns.br`), não em `a.auto.dns.br` (lição [L38](../../LICOES.md)).

- [x] **T9b — Publicação e certificado** ✅ 2026-11-02
  A zona publicou e o `flyctl certs check` devolveu **`Status = Issued`**, CA **Let's Encrypt**, rsa+ecdsa.
  **CA1 fechado:** `https://veloswallet.com.br` responde **200**, com `ssl_verify_result=0`, servido pelo IPv6 do Fly. O `http://` redireciona com **301**.

- [x] **T10a — Supabase** ✅ 2026-11-02
  *Site URL* passou a `https://veloswallet.com.br`. Nas *Redirect URLs* entraram `https://veloswallet.com.br/auth/confirm` e `https://veloswallet.com.br/auth/callback**`; o `http://localhost:3000/**` **ficou**, para o desenvolvimento continuar a funcionar.
  **CA4 confirmado:** pedido de recuperação feito contra o domínio devolveu **202**, e o email que chegou traz `redirect_to=https://veloswallet.com.br/auth/confirm`. O fluxo completo já tinha sido validado hoje em localhost (T9 da spec 001); o link deste teste não foi consumido.

- [ ] **T10b — Google OAuth** *(bloqueado)*
  Sair do modo *Teste* depende das páginas de política de privacidade e termos (item **L1** da auditoria), que estão fora desta spec. Até lá o login com Google só funciona para os *test users*, e o **CA5** fica por fechar.

- [ ] **T11 — Aceite** *(parcial)*
  | | |
  |---|---|
  | **CA1** certificado válido | ✅ |
  | **CA2** entrar e ver os dados | ⏳ precisa do Pedro |
  | **CA3** continuar logado após redeploy | ⏳ o mecanismo foi provado na T5 (mesma chave no volume); falta no ar |
  | **CA4** recuperação com link do domínio | ✅ |
  | **CA5** login com Google | ⛔ bloqueado pela T10b |
  | **CA6** PWA instalável | ✅ service worker **`activated`** em `https://veloswallet.com.br/`, manifest em 200 — **destrava a Etapa 8** |
  | **CA7** Host de outro domínio recusado | ✅ provado na T5 e no ar (`velos-wallet.fly.dev` → 400) |
  | **CA8** sem segredos na imagem, sem root | ✅ provado na T5 |
  | **CA9** limite por IP vê o IP do cliente | ⏳ por conferir no ar |

- [ ] **T12 — Documentação**
  [ROADMAP](../../ROADMAP.md), [CHANGELOG](../../CHANGELOG.md), [LICOES](../../LICOES.md). Decidir o que fazer com a **Vercel**, que continua ligada ao repositório e não roda .NET.
