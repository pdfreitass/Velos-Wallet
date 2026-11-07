# Roadmap

> Leia no **início de cada sessão** para saber onde paramos.
> Atualize **ao terminar cada feature** (junto com [CHANGELOG.md](CHANGELOG.md) e [LICOES.md](LICOES.md)).

**🚀 O Velos Wallet está NO AR em https://veloswallet.com.br desde 2026-11-02** (Fly.io `gru`, [spec 011](specs/011-deploy/spec.md), [ADR 0020](adr/0020-host-fly-io-gru.md)). O MVP tem 7 de 8 etapas fechadas; a **Etapa 8 (PWA) ficou destravada**, porque o service worker já registra com HTTPS de verdade. Conferido no ar: ✅ **conta real entrando normalmente** e ✅ **o redeploy de 2026-11-03 não deslogou ninguém** (as chaves do Data Protection no volume `velos_keys` sobreviveram à atualização da máquina). Falta só conferir o **limite por IP** — atualizado em 2026-11-03.

> **Numeração:** são 8 etapas, a mesma que os comentários do código já usam ("Etapa 2" = banco, "Etapa 3" = autenticação, "Etapa 6" = dashboard). A identidade visual faz parte da Etapa 1. O checklist antigo do `CLAUDE.md` tinha 9 itens porque contava a identidade visual à parte.

## ✅ Pronto

### Etapa 1 — Setup do projeto
> Feita em Next.js; a stack foi trocada na Etapa 3 ([ADR 0013](adr/0013-api-aspnet-e-front-react-vite.md)). Tokens, tema, componentes e helpers migraram para `web/`.

- Next.js 15.5.27 + React 19.1 + TypeScript strict, App Router com Turbopack
- Tailwind v4 + shadcn/ui sobre `@base-ui/react` (`button`, `card`)
- Clients Supabase via `@supabase/ssr` (browser, server, middleware)
- Identidade visual nos tokens, tema claro/escuro sem flash, contraste WCAG verificado
- Helpers de dinheiro (`currency.ts`) e de data (`date.ts`)
- Scripts `typecheck`, `lint`, `types:db`
- Página temporária de validação em `src/app/page.tsx`

### Etapa 2 — Modelo de dados
- Migrations `0001`–`0004` aplicadas em **sa-east-1** via `supabase db push`
- 6 tabelas, 2 enums, 3 views (`security_invoker`), 23 policies de RLS
- Trigger `handle_new_user` (profile + 10 categorias padrão) e `set_updated_at`
- `database.types.ts` gerado do banco real
- RLS verificada: sem sessão, a chave publicável recebe `[]`

### Etapa 3 — Autenticação ([spec 001](specs/001-autenticacao/tasks.md))
> Começou em Next.js; em 2026-10-12 a stack mudou para **API ASP.NET + React/Vite** ([ADR 0013](adr/0013-api-aspnet-e-front-react-vite.md)).

- Cadastro, entrar e sair reais; sessão em cookies `httpOnly` (o navegador nunca vê token); renovação automática do token
- **Login com Google** (PKCE feito pela API) e **recuperação de senha** (PKCE, link de uso único, ticket de 15 min para trocar a senha)
- **Bloqueio de tentativas**: 5 erros → 10 min, aviso da 3ª em diante, igual para email sem conta, tentativa reservada no banco ([ADR 0014](adr/0014-bloqueio-de-tentativas-de-login.md))
- Toda rota privada por padrão ([ADR 0015](adr/0015-rotas-privadas-por-padrao.md)), CSRF por header, limite por IP nas rotas de auth, cabeçalhos de segurança, redirect só para dentro do app
- Revisões `security` e `qa` aprovadas com ressalvas; as ressalvas da etapa foram corrigidas, as de deploy estão na lista abaixo
- 120 testes (Domain, Application, integração com o banco)
- ~~**Pendência conhecida:** CA7 (recuperação de ponta a ponta)~~ ✅ **validado em 2026-11-02** (pendência T9), assim que o Resend passou a enviar: email na caixa de entrada → link abre `/redefinir-senha` → senha trocada → login com a senha nova → o mesmo link devolve 403

### Página inicial ([spec 003](specs/003-pagina-inicial/tasks.md))
- Página pública em `/` (composição "Tudo converge"): as contas ligadas por fios ao iPhone desenhado em código, 4 telas trocáveis, seções com o iPhone fixo no desktop, faixa "Privado por padrão", fechamento "Sem loja de apps."
- Mesmo iPhone, compacto, no painel das telas de entrada; logado em `/` vai ao painel
- Telas do app em `lazy()`: pacote inicial 99 KB gzip; Lighthouse no celular 93–96 / acessibilidade 100
- `DESIGN.md` do sistema visual (Impeccable)

### Rosca de gastos por categoria ([spec 010](specs/010-rosca-de-categorias/spec.md))
*2026-11-02 — revisão da Etapa 6*

- O Início mostra os gastos do mês numa **rosca** acima da lista, com o **mesmo componente** da vitrine da página inicial: as duas deixaram de divergir.
- No máximo **6 fatias** (as 5 maiores e "Outras"); a lista por baixo continua completa e clicável, e nenhuma linha se chama "Outras".
- Sem dependência nova — `conic-gradient` em CSS ([ADR 0019](adr/0019-rosca-de-categorias-em-css.md), que revê o desenho do [0018](adr/0018-grafico-de-categorias-sem-biblioteca.md) e mantém a regra de não instalar biblioteca de gráfico).
- **CA1–CA8, CA-a11y e CA-build conferidos**, incluindo o caminho do agrupamento, com despesas de sonda criadas e apagadas em novembro.

### Simulação de corte ([spec 012](specs/012-simulacao-de-corte/spec.md))
*2026-11-03 — primeira ideia a sair do [caderno](IDEIAS.md) (era a I5)*

- `/simular`: escolher a categoria, cortar 10/20/30% ou livre, e ver quanto sobraria **por mês, em 6 e em 12 meses**. O resultado muda em memória, sem ir à rede.
- **"Transformar em meta"** abre `/metas/nova` preenchida — e não salva nada até a pessoa confirmar.
- A base é a **média dos 3 meses completos anteriores** (o mês corrente fica fora). Sem mês completo, a tela diz que ainda não dá para simular, em vez de mostrar número fraco; com 1 ou 2, avisa em quantos meses a média se apoia.
- **Sem migration e sem dependência nova.** A média é somada no banco; a janela vem do `TransactionRules`, que continua a ser a única fonte do fuso de São Paulo.
- **Conferido no navegador** em 375 px, nos dois temas, com três meses semeados numa conta de teste depois apagada. **CA9 ("Sem categoria") também conferido no navegador** em 2026-11-03, com despesa sem categoria de verdade (categoria apagada depois dos lançamentos) — e agora **coberto para sempre pelo E2E `probe`** ([ADR 0022](adr/0022-testes-e2e-com-playwright.md)), junto com a parte estrutural do `aria-live`. Falta só **ouvir** o anúncio num leitor de tela de verdade.

### Backup do banco ([ADR 0021](adr/0021-backup-pg-dump-github-actions.md))
*2026-11-03 — fechando o único risco sem volta*

- Workflow **diário** (03:00 UTC, 00:00 em São Paulo) + `workflow_dispatch` que despeja o banco com `pg_dump` pelo **pooler de sessão**, confere o arquivo, **cifra com GPG (AES256)** e sobe o `.gpg` como artefato do Actions.
- Cobre `public` (dados financeiros) + `auth` (contas) + `supabase_migrations`; schemas gerenciados pela plataforma ficam de fora.
- **Falha abre issue automaticamente** — é o aviso que faltava.
- Restauração documentada no ADR: dados no mesmo projeto (`--data-only`) e projeto novo (com ressalvas do `auth`).
- **Falta o Pedro criar os segredos** `SUPABASE_DB_PASSWORD` e `BACKUP_PASSPHRASE` no GitHub e **disparar o workflow uma vez** para provar o caminho de ponta a ponta.

## 🟡 Em andamento

**Etapa 8 — PWA** ([spec 009](specs/009-pwa/tasks.md)): T1–T5 feitas (ícones, manifest, `index.html`, service worker, instalável confirmado pelo Pedro). **Em 2026-11-03 o teste offline (CA6) saiu da lista:** virou E2E com Playwright ([ADR 0022](adr/0022-testes-e2e-com-playwright.md)) — e encontrou um bug real, já corrigido: o TanStack Query no padrão `online` pausava toda query nova sem internet, e a tela ficava em "Carregando…" eterno em vez do estado de erro. **Correção no ar desde 2026-11-03**: a sonda E2E completa passou contra a produção depois do deploy (CA9 + `aria-live` estrutural + CA6 offline, 1/1) e o `readonly` fechou 4/4. **iPhone confirmado pelo Pedro no mesmo dia (CA4/CA5: instalado na tela de início, uso diário por email)**. Faltam: **Android (CA3)**, o **login com Google no iPhone (P3)** e ouvir o `aria-live` num leitor de tela.

> **Atenção ao testar o PWA:** o navegador embutido do Claude **não registra service worker** — falha sempre com *"An unknown error occurred when fetching the script"*. Testar no Chrome de verdade. Confirmado em 2026-11-01: lá o SW chega a `activated` normalmente, com a CSP completa em toda resposta.

**Pré-deploy** (ver a seção abaixo): o domínio foi comprado e o Resend está configurado. O que falta é a **escolha do host** (Azure *Brazil South* ou Fly.io `gru`), que destrava o resto.

### Critérios de aceite que nunca foram rodados

Entraram na `main` sem esse passo. Não bloqueiam nada hoje, mas são dívida:

- **T14 da [spec 002](specs/002-contas-e-categorias/tasks.md)** (Etapa 4): aceite com login real, IDOR com duas contas, CA6b/CA10 com movimentações por SQL.
- **T10 da [spec 004](specs/004-transacoes/tasks.md)** (Etapa 5): aceite com login real.

Os da Etapa 6 (CA1–CA7) e da Etapa 7 (CA1–CA8) **foram** conferidos no navegador em 2026-11-01, nos dois temas e em 375 px.

## ⬜ Pendente

| Etapa | Escopo | Depende de |
|---|---|---|
| ~~4 — Contas e categorias~~ | ✅ no código; falta T14 e PR (ver acima) | 3 |
| ~~5 — Transações~~ | ✅ no código; falta T10 e PR (ver acima) | 4 |
| ~~6 — Dashboard~~ | ✅ pronta; CA1–CA7 conferidos; falta a PR. **Em 2026-11-02 o gráfico passou de barras a rosca** ([spec 010](specs/010-rosca-de-categorias/spec.md), [ADR 0019](adr/0019-rosca-de-categorias-em-css.md)), partilhada com a vitrine da página inicial — continua sem biblioteca | 5 |
| ~~7 — Metas~~ | ✅ no código ([spec 006](specs/006-metas/spec.md)); falta a PR | 3 |
| **8 — PWA** | 🟡 em andamento ([spec 009](specs/009-pwa/spec.md)) | 6 |

### ⚠️ Decisão pendente: excluir conta ou arquivar?

A [spec 007 — Fundação](specs/007-fundacao/spec.md), escrita em 19/10 a partir da [auditoria](audit/08-implementation-roadmap.md), registra a decisão **D2: arquivar conta e bloquear exclusão com movimentos**. Isso é o oposto do [ADR 0017](adr/0017-excluir-conta-apaga-movimentacoes.md), que é o que o código da Etapa 4 faz hoje (excluir apaga as movimentações, com aviso detalhado).

As duas linhas de trabalho correram em paralelo e nenhuma sabia da outra. **O Pedro decide qual vale.** Até lá, o ADR 0017 é o que está no ar. O resto da spec 007 — Fundação já foi entregue por outros caminhos ou virou as pendências T15 e T16; o estado item a item está no topo daquela spec.

**Antes do deploy em produção** (sem etapa própria ainda — **A DEFINIR** quando entra):

### Infraestrutura já contratada (2026-11-01/02)

| O quê | Estado |
|---|---|
| **Domínio** | ✅ **`veloswallet.com.br`**, pago, no Registro.br, publicado, vence 01/11/2027. Registrado com CPF — não precisou de CNPJ. O `velos.com.br` já tinha dono |
| **DNS** | Servidores do próprio Registro.br, em **modo avançado**. A delegação real é **`a.sec.dns.br` / `c.sec.dns.br`** — o painel menciona `a.auto.dns.br`, que *não* serve a zona (ver abaixo) |
| **Resend** | ✅ Domínio adicionado, região **São Paulo (`sa-east-1`)**, **click tracking desligado** |
| **Chave de API** | ✅ Criada com permissão **Sending access** (não Full access), colada por ti no SMTP do Supabase |
| **Registros DNS** | ✅ Criados, salvos e **publicados** (conferido em 2026-11-02 nos NS reais e no `8.8.8.8`) |

**Os três registros criados na zona** (conferidos valor a valor antes de salvar):

| Tipo | Nome | Conteúdo |
|---|---|---|
| TXT | `resend._domainkey` | a chave DKIM (219 caracteres; o Registro.br põe as aspas sozinho) |
| CNAME | `rsend` | `rsend-sae1.forge.rmta.net` |
| CNAME | `send` | `send.forge.rmta.net` |

**O `MX @ → receive-sae1.forge.rmta.net` foi deixado de fora de propósito.** Ele pertence à seção *Enable receiving* do Resend, e o Velos só **envia**. Criá-lo faria todo email destinado a `@veloswallet.com.br` cair no Resend, impedindo uma caixa de verdade (Google Workspace, Zoho) nesse domínio depois.

> ✅ **O DNS publicou** — conferido em 2026-11-02. A nota anterior dizia o contrário por **consultar os servidores errados**: o `veloswallet.com.br` está delegado a **`a.sec.dns.br` / `c.sec.dns.br`**, não a `a.auto.dns.br`. O `a.auto.dns.br` responde SOA para o domínio (dizendo `NS = a.auto/b.auto`), mas não serve a zona publicada — e devolve *Non-existent domain* para tudo, o que é indistinguível de "ainda não publicou".
>
> **Ao conferir DNS, descobrir a delegação primeiro:**
> ```
> nslookup -type=NS veloswallet.com.br 8.8.8.8
> nslookup -type=CNAME send.veloswallet.com.br a.sec.dns.br
> nslookup -type=TXT resend._domainkey.veloswallet.com.br a.sec.dns.br
> ```
> Os três registros (`resend._domainkey`, `send`, `rsend`) respondem nos NS reais **e** no `8.8.8.8` público.

### O que falta, na ordem

1. ~~**Verificar o domínio no Resend**~~ ✅ **feito em 2026-11-02, 11:22**. O domínio está **Verified**, região São Paulo, e o `POST /auth/v1/recover` passou a devolver **200** — o email sai.
   > O botão *Verify DNS records* fica no **canto superior direito da página do domínio**, não na lista. Publicar o DNS **não** verifica sozinho: sem o clique o domínio fica em `Not Started` para sempre, e o Resend recusa todo envio com `550 "The veloswallet.com.br domain is not verified"`. Antes do clique, o T9 falhava com **500 `unexpected_failure`** no `/recover` e *"Não foi possível falar com o servidor de autenticação"* no front — a causa só aparecia nos **auth logs do Supabase** (lição [L39](LICOES.md)).
   >
   > Ao verificar, o **Resend Forge** passou sozinho de `Disabled` a `Enabled`. O *tracking metrics* segue **desconfigurado** (só o botão *Configure*), que é como tem de ficar: com click tracking o Resend reescreve os links e quebra o link de uso único ([L37](LICOES.md)).
2. ~~**Testar a recuperação de senha de ponta a ponta** (**T9**)~~ ✅ **feito em 2026-11-02**. Aberta desde a Etapa 3, e o primeiro teste real da correção do `recovery.html` (2026-11-01) — que fica **validada**. Timeline dos auth logs:
   >
   > | Hora (UTC) | Evento | Resultado |
   > |---|---|---|
   > | 14:29:06 | `POST /recover` | **200** — email enviado |
   > | 14:30:07 | `GET /verify` | **303**, token trocado por `?code=<uuid>` |
   > | 14:30:14 | `POST /token` | **200**, `grant_type: pkce`, `provider_type: recovery` |
   > | 14:31:13 | `PUT /user` | **200**, `user_modified` — senha trocada |
   > | 14:31:28 | `GET /verify` (reuso) | **403** `One-time token not found` |
   > | 14:33:33 | `POST /token` | **200**, `grant_type: password` — entrou com a senha nova |
   >
   > O email chegou na **caixa de entrada** (não spam), de `Velos Wallet <nao-responda@veloswallet.com.br>`. No reuso, o app encaminha para `/recuperar-senha?erro=link` e mostra *"Este link não é mais válido…"* (`ForgotPasswordForm.tsx:94`). O limite de email do Supabase subiu de `2/1h` para **30** quando o SMTP próprio entrou — era isso que mantinha o T9 parado.

3. ~~**O email de auth sai com o template padrão do Supabase, em inglês**~~ ✅ **resolvido em 2026-11-02** — ver o item 5, que é a versão certa deste mesmo assunto. Este item ficou para trás e **contradizia o 5 dentro do próprio documento** até 2026-11-07, quando os dois modelos foram conferidos no painel.

4. 🔍 **Um link de recuperação foi consumido 54 s depois do envio**, a partir do IP do Pedro, antes de alguém o abrir (`/verify` 303 com `action: login` às 14:25:10, para um email de 14:24:16). Suspeita de scanner de links — antivírus na máquina ou varredura do Gmail na entrega. **Uma única ocorrência**, e o link seguinte sobreviveu 59 s, então não está estabelecido. Se voltar a acontecer é sério: queima o link antes de o usuário clicar, e a recuperação falha sem explicação para quem tiver o mesmo antivírus.
5. ~~**Publicar os modelos** de `supabase/templates/` (passo C3)~~ ✅ **feito em 2026-11-02**: o `recovery.html` está no painel, e o email chega em português, com a logo e o botão em verde profundo. O C6 (logo no bucket) também já estava feito.
   > **Só a aba *Reset password* entrou**, e de propósito. As de *Invite*, *Magic link*, *Change email* e *Reauthentication* o app não usa. A de *Confirm signup* fica para o C1 — ver o item seguinte.

6. 🟡 **Religar a confirmação de email** (Revisão 1 da spec 001, passo **C1**) — virou a **[spec 013](specs/013-confirmacao-de-email/spec.md)**, quase fechada.

   O diagnóstico original continua certo, e é por isso que isto não era "ligar um interruptor": o `confirmation.html` apontava para `/auth/confirm?token_hash=…`, que falha por duas razões — esse endpoint lê **só** `?code=`, e além disso é a rota da **redefinição de senha**. A spec 013 construiu a rota própria (`/auth/confirmar-cadastro`), o fluxo PKCE e as telas.

   **Estado em 2026-11-07, conferido no painel:**

   | Peça | Estado |
   |---|---|
   | T1–T4 (API, rotas, telas) | ✅ no ar |
   | Flag *Confirm email* | ✅ ligada desde 03/11 |
   | Modelo no painel (*Confirm signup*) | ✅ publicado, em português, com `{{ .ConfirmationURL }}` — idêntico ao versionado (o painel guarda em CRLF, daí 137 bytes a mais) |
   | Redirect URLs | ✅ `/auth/confirmar-cadastro` é coberto pelo wildcard `https://veloswallet.com.br/auth/confirm*` |

   > ⚠️ **O wildcard cobre por acidente, não por desenho.** `confirm*` casa com `confirmar-cadastro` — e também com qualquer outra rota que comece por `confirm`. Se a rota for renomeada, quebra em silêncio. Vale trocar por entradas explícitas, com cuidado: `/auth/confirm` é usada pela recuperação de senha.

   **Falta:** T3-bis (provar o fluxo ponta a ponta contra produção), T6 (E2E do cadastro), T7 (bateria e revisões) e T8 (documentação).
7. 🟡 ~~**Escolher o host**~~ ✅ decidido em 2026-11-02: **Fly.io `gru`** ([ADR 0020](adr/0020-host-fly-io-gru.md)). O deploy em si é a [spec 011](specs/011-deploy/spec.md), **em andamento**: `Dockerfile`, `.dockerignore`, `fly.toml` e os ajustes de produção da API (chaves do Data Protection persistidas, `ForwardedHeaders` restrito ao proxy) estão **prontos e commitados**.
   > ✅ **Tudo isto foi feito em 2026-11-02**: conta no Fly, `flyctl`, `fly launch`, volume `velos_keys`, segredos, deploy, certificado Let's Encrypt e os registros A/AAAA. O `Dockerfile` foi construído e provado — e desde então corrigido duas vezes, por faltarem `tzdata` e `icu-libs` na imagem Alpine ([LICOES](LICOES.md)). Só o domínio nu; `www` ficou de fora.

> ⚠️ **A Vercel está ligada ao repositório** e gera preview em cada PR, mas o [ADR 0013](adr/0013-api-aspnet-e-front-react-vite.md) diz que **ela não roda .NET**: o preview é só o front, sem API, e não loga. Decidir se desliga.

### Google OAuth — conferido em 2026-11-01

Projeto `peak-responder-474615-i4`, cliente "Velos Wallet (web)". Status **Testando**, tipo Externo.

- **Escopos sensíveis e restritos: zero.** O Supabase usa só `openid`, `email` e `profile`. O próprio painel diz: *"A verificação não é necessária porque seu app está no Status de teste."* **Não há verificação de semanas** — publicar é imediato.
- **Enquanto estiver em Testando, só os emails cadastrados como test users entram com Google** — e o contador mostra **0**. Vale conferir se o botão funciona para alguém além do dono.
- **O botão "Publicar app" está bloqueado** por três campos vazios no *Branding*: página inicial, política de privacidade e termos de serviço. Os três dependem do **domínio no ar** e das páginas, que são o item **L1 (LGPD)** da auditoria.
- URLs de redirect do Supabase Auth para o domínio final, **exatas e sem curinga de host** (`https://<domínio>/auth/confirm` e `https://<domínio>/auth/callback**`); Google OAuth fora do modo *Teste*
- Variáveis do host: `App__PublicOrigin=https://<domínio>`, `AllowedHosts=<domínio>`, `ConnectionStrings__Velos` com **`SSL Mode=VerifyFull`** e o certificado do Supabase (hoje `Require`, que cifra mas não valida o servidor)
- `ForwardedHeaders` restrito ao proxy do host (`KnownProxies`/`KnownNetworks`), para o limite por IP ver o IP do cliente
- Chaves do Data Protection persistidas (volume ou key vault): sem isso, reiniciar a API invalida os links de recuperação e o login com Google em andamento
- Achados da auditoria de 2026-10-17 (T15 da spec 002): **SEC-002** ⚠️ **revisado em 2026-11-01: revogar de `anon` QUEBRA O LOGIN** — o `LoginLockoutStore` chama `reserve_login_attempt` com `AsAnonAsync`, antes de o usuário se autenticar. O que protege é **conferir a Data API desligada** no painel (sem ela, a chave publicável não alcança a função por HTTP); revogar só de `authenticated` é seguro e reduz superfície; ~~**SEC-004** CSP completa~~ ✅ **feita em 2026-11-01** (`ContentSecurityPolicy.cs`: o hash do script de tema sai do `index.html` servido, no arranque, nunca escrito à mão — o repo guarda LF e o Windows traz CRLF, e os hashes diferem; **nota da spec 009 (T8): a CSP já traz `worker-src 'self'` e `manifest-src 'self'`**, então service worker e manifest passam — conferido pelo E2E `readonly` em 2026-11-03); **SEC-005** ligar a proteção contra senhas vazadas no Supabase; ~~ligar Dependabot~~ ✅ `.github/dependabot.yml` em 2026-11-01 (npm do `web`, NuGet da `api`, actions do CI e o Remotion do vídeo; agrupado por ecossistema para não encher de PR); falta **ligar o secret scanning** no GitHub (*Settings → Code security*), que é do Pedro
- ~~Modelo `supabase/templates/recovery.html` com `{{ .ConfirmationURL }}`~~ ✅ corrigido em 2026-11-01: o modelo montava `token_hash`, que o `/auth/confirm` ignora (ele lê só `?code=` do PKCE), então **todo link de recuperação caía no erro**. O teste de ponta a ponta (T9) **validou a correção em 2026-11-02**. O `confirmation.html` segue com `token_hash` de propósito — rever no C1, quando a confirmação de email voltar

## Pendências técnicas

Coisas pequenas encontradas pelo caminho. Resolver na etapa indicada ou numa PR de `chore`.

| # | Pendência | Onde | Quando |
|---|---|---|---|
| ~~T1~~ | ~~`goal_contributions` sem `updated_at`~~ | ✅ resolvida na `0013`, aplicada em 2026-10-18 | — |
| ~~T2~~ | ~~`supabase/migrations/.gitkeep` gera o aviso "Skipping migration .gitkeep"~~ | ✅ arquivo removido na limpeza de 2026-10-15 | — |
| ~~T3~~ | ~~Textos de UI sem acento~~ | ✅ resolvida na T10 da spec 001 (`web/index.html` e página provisória com acento) | — |
| ~~T4~~ | ~~`hasSupabaseEnv()` do middleware~~ | ✅ obsoleta: o middleware do Next saiu na troca de stack (ADR 0013) | — |
| ~~T5~~ | ~~Imagens padrão do create-next-app sem uso~~ | ✅ removidas na T10 da spec 001 (`e4da686`) | — |
| T7 | Fios das seções da página inicial apontam para o iPhone fixo, mas não chegam à linha exata da tela (revisor de acabamento: "parcial") | `web/src/features/landing/StepArtifacts.tsx` | **A DEFINIR** pelo Pedro |
| ~~T8~~ | ~~Botões de 32–40 px abaixo do alvo de 44 px~~ | ✅ resolvida na T8 da spec 002 (Button com 44 px ou área estendida; `--sidebar-ring` já era #197A50) | — |
| ~~T6~~ | ~~Logos originais duplicados na raiz~~ | ✅ movidos para `media/brand/` na limpeza de 2026-10-15 (`web/public/brand/` segue sendo o que o app usa) | — |
| ~~T9~~ | ~~**CA7 da spec 001**: testar a recuperação de ponta a ponta~~ ✅ validado em 2026-11-02, com o Resend a enviar: os cinco passos passaram (ver a seção do pré-deploy) | `/recuperar-senha` | — |
| ~~T10~~ | ~~Vermelho de despesa sobre o card escuro dava 3,71:1~~ | ✅ resolvida na T8 da spec 002 (`#F08084`: 4,68:1 no card; contrastes do card anotados em `globals.css`) | — |
| ~~T11~~ | ✅ resolvida nas migrations `0009`/`0010` da spec 002. ~~FK `(category_id, user_id) on delete set null` da `0001` tentaria anular também o `user_id` (que é `not null`): apagar categoria com transações falha. Corrigir com `on delete set null (category_id)`~~ | migration nova | — |
| T13 | `velos:last-account` e `velos:last-category:*` ficam no `localStorage` depois do "Sair" (o `useSignOut` faz `queryClient.clear()`, que não limpa o storage): num aparelho compartilhado o formulário do próximo usuário vem pré-preenchido com ids do anterior. Só GUIDs, sem dado financeiro, e a API rejeita — mas revela que existiu outra conta ali. Achado da revisão `security` da spec 006 | `web/src/lib/utils/last-used.ts`, `web/src/features/auth/api.ts` | `chore` ou quando mexer no logout |
| T16 | **FI-07 da auditoria:** o teto de R$ 999.999.999,99 existe só no validator da API; o banco tem `> 0` mas não o limite superior | migration nova (0014+) | `chore` |
| T15 | **FI-04 da auditoria:** `goal_contributions.date` ainda tem `default current_date` (que roda em UTC). A API sempre envia a data, então não machuca hoje | migration nova (0014+) | `chore` |
| T14 | Saldo total **negativo** aparece no cartão de verde vivo (tema escuro) com o sinal "−", mas o verde ainda lê como "positivo" num relance. O DESIGN.md diz que verde vivo é *dinheiro*, não *positivo*, então não é violação — é uma escolha a confirmar. Visto ao conferir o CA2 da spec 005 | `web/src/features/dashboard/BalanceCards.tsx` | **A DEFINIR** pelo Pedro |
| T17 | O link **"E se você cortasse um desses?"** (entrada de `/simular`) só aparece no bloco "Gastos por categoria" quando há despesa **no mês corrente**. Quem só tem gastos em meses anteriores não vê link nenhum e só chega à simulação pela URL. Visto ao conferir o CA9 da spec 012 em 2026-11-03 | `web/src/features/dashboard/CategorySpending.tsx` | **A DEFINIR** pelo Pedro |
| T12 | Detalhes da revisão `qa`: texto "10 minutos"/"5 senhas" fixo no front (`SignInForm`, `LockedNotice`) em vez de vir da API; checklist de senha marca ✕ em momentos diferentes no cadastro e na redefinição; `SignInForm.tsx` (157) e `SupabaseAuthClient.cs` (179) acima de ~150 linhas; `result.Error!` repetido; comentários sem acento | `web/src/features/auth/`, `api/` | `chore` ou quando mexer nos arquivos |
