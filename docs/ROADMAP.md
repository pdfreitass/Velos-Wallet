# Roadmap

> Leia no **início de cada sessão** para saber onde paramos.
> Atualize **ao terminar cada feature** (junto com [CHANGELOG.md](CHANGELOG.md) e [LICOES.md](LICOES.md)).

**Progresso do MVP: 3 de 8 etapas fechadas (38%); Etapas 4, 5 e 7 prontas no código, 6 com os critérios já conferidos; 8 (PWA) quase lá. As quatro esperam PR** — atualizado em 2026-11-01.

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
- **Pendência conhecida:** CA7 (recuperação de ponta a ponta, com o email chegando) não foi testado, por causa do limite de email do servidor padrão do Supabase. O servidor já recusa a troca sem o link. Testar quando o limite permitir (pendência T9)

### Página inicial ([spec 003](specs/003-pagina-inicial/tasks.md))
- Página pública em `/` (composição "Tudo converge"): as contas ligadas por fios ao iPhone desenhado em código, 4 telas trocáveis, seções com o iPhone fixo no desktop, faixa "Privado por padrão", fechamento "Sem loja de apps."
- Mesmo iPhone, compacto, no painel das telas de entrada; logado em `/` vai ao painel
- Telas do app em `lazy()`: pacote inicial 99 KB gzip; Lighthouse no celular 93–96 / acessibilidade 100
- `DESIGN.md` do sistema visual (Impeccable)

## 🟡 Em andamento

**Etapa 5 — Transações** ([spec 004](specs/004-transacoes/tasks.md)): **pronta no código** (T1–T9, revisões `security`/`qa` na T11, migration `0011` aplicada). Falta: T10 (critérios de aceite com login real) e a PR.

**Etapa 6 — Dashboard** ([spec 005](specs/005-dashboard/tasks.md)): **pronta** (T1–T5; `0012` aplicada; revisões aprovadas). **CA1–CA7 conferidos no navegador com login real em 2026-11-01**, nos dois temas e em 375 px. Falta: a PR.

**Etapa 7 — Metas** ([spec 006](specs/006-metas/tasks.md)): **pronta no código** (T1–T8; `0013` aplicada; revisões `security` aprovada e `qa` com as ressalvas corrigidas; CA1–CA8 conferidos no navegador com login real, nos dois temas, em 375 e 1440 px). Falta: a PR.

**Etapa 8 — PWA** ([spec 009](specs/009-pwa/tasks.md)): T1–T5 feitas (ícones, manifest, `index.html`, service worker, instalável confirmado pelo Pedro). Faltam: o teste offline (CA6), aparelhos reais (T6), as revisões (T7) e a documentação (T8).

**Etapa 4 — Contas e categorias** ([spec 002](specs/002-contas-e-categorias/tasks.md)): **pronta no código** (T1–T13, T15–T17). Faltam: **T14** (critérios de aceite com login real, IDOR com duas contas, CA6b/CA10 com movimentações por SQL e os testes de integração) e **T18** (PR para a `main`).

- API de contas e categorias com RLS e filtro por `user_id`; navegação do app (barra inferior / menu lateral); telas de contas e categorias com os estados de carregando, vazio e erro; `MoneyInput`, `CategoryBadge` e a paleta com contraste medido nos dois temas; [ADR 0017](adr/0017-excluir-conta-apaga-movimentacoes.md)
- Auditoria de segurança (T15): nenhum crítico ou alto; SEC-001 e SEC-003 corrigidos; SEC-002, SEC-004 e SEC-005 na lista de deploy abaixo

## ⬜ Pendente

| Etapa | Escopo | Depende de |
|---|---|---|
| ~~4 — Contas e categorias~~ | ✅ no código; falta T14 e PR (ver acima) | 3 |
| ~~5 — Transações~~ | ✅ no código; falta T10 e PR (ver acima) | 4 |
| ~~6 — Dashboard~~ | ✅ pronta (barras sem Recharts, [ADR 0018](adr/0018-grafico-de-categorias-sem-biblioteca.md)); CA1–CA7 conferidos; falta a PR | 5 |
| ~~7 — Metas~~ | ✅ no código ([spec 006](specs/006-metas/spec.md)); falta a PR | 3 |
| **8 — PWA** | 🟡 em andamento ([spec 009](specs/009-pwa/spec.md)) | 6 |

### ⚠️ Decisão pendente: excluir conta ou arquivar?

A [spec 007 — Fundação](specs/007-fundacao/spec.md), escrita em 19/10 a partir da [auditoria](audit/08-implementation-roadmap.md), registra a decisão **D2: arquivar conta e bloquear exclusão com movimentos**. Isso é o oposto do [ADR 0017](adr/0017-excluir-conta-apaga-movimentacoes.md), que é o que o código da Etapa 4 faz hoje (excluir apaga as movimentações, com aviso detalhado).

As duas linhas de trabalho correram em paralelo e nenhuma sabia da outra. **O Pedro decide qual vale.** Até lá, o ADR 0017 é o que está no ar. O resto da spec 007 — Fundação já foi entregue por outros caminhos ou virou as pendências T15 e T16; o estado item a item está no topo daquela spec.

**Antes do deploy em produção** (sem etapa própria ainda — **A DEFINIR** quando entra):
- Escolher o host do app (API + SPA num processo só) em São Paulo: Azure *Brazil South* ou Fly.io `gru` — [ADR 0013](adr/0013-api-aspnet-e-front-react-vite.md); HTTPS/HSTS e connection string como variável de ambiente
- Resend + domínio próprio e **religar a confirmação de email** (Revisão 1 da spec 001). Junto com o Resend vão **os modelos de email** de `supabase/templates/` (passo C3): desde 2026-10-13 o Supabase exige SMTP próprio para editar modelo, então até lá o email de recuperação sai no padrão dele, em inglês e sem logo
- URLs de redirect do Supabase Auth para o domínio final, **exatas e sem curinga de host** (`https://<domínio>/auth/confirm` e `https://<domínio>/auth/callback**`); Google OAuth fora do modo *Teste*
- Variáveis do host: `App__PublicOrigin=https://<domínio>`, `AllowedHosts=<domínio>`, `ConnectionStrings__Velos` com **`SSL Mode=VerifyFull`** e o certificado do Supabase (hoje `Require`, que cifra mas não valida o servidor)
- `ForwardedHeaders` restrito ao proxy do host (`KnownProxies`/`KnownNetworks`), para o limite por IP ver o IP do cliente
- Chaves do Data Protection persistidas (volume ou key vault): sem isso, reiniciar a API invalida os links de recuperação e o login com Google em andamento
- Achados da auditoria de 2026-10-17 (T15 da spec 002): **SEC-002** ⚠️ **revisado em 2026-11-01: revogar de `anon` QUEBRA O LOGIN** — o `LoginLockoutStore` chama `reserve_login_attempt` com `AsAnonAsync`, antes de o usuário se autenticar. O que protege é **conferir a Data API desligada** no painel (sem ela, a chave publicável não alcança a função por HTTP); revogar só de `authenticated` é seguro e reduz superfície; ~~**SEC-004** CSP completa~~ ✅ **feita em 2026-11-01** (`ContentSecurityPolicy.cs`: o hash do script de tema sai do `index.html` servido, no arranque, nunca escrito à mão — o repo guarda LF e o Windows traz CRLF, e os hashes diferem); **SEC-005** ligar a proteção contra senhas vazadas no Supabase; ~~ligar Dependabot~~ ✅ `.github/dependabot.yml` em 2026-11-01 (npm do `web`, NuGet da `api`, actions do CI e o Remotion do vídeo; agrupado por ecossistema para não encher de PR); falta **ligar o secret scanning** no GitHub (*Settings → Code security*), que é do Pedro
- ~~Modelo `supabase/templates/recovery.html` com `{{ .ConfirmationURL }}`~~ ✅ corrigido em 2026-11-01: o modelo montava `token_hash`, que o `/auth/confirm` ignora (ele lê só `?code=` do PKCE), então **todo link de recuperação caía no erro**. Falta só o teste de ponta a ponta (T9), que depende do Resend. O `confirmation.html` segue com `token_hash` de propósito — rever no C1, quando a confirmação de email voltar

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
| T9 | **CA7 da spec 001**: testar a recuperação de ponta a ponta (pedir o link, abrir, trocar a senha, entrar com ela, o link não funcionar de novo) com o email do Pedro | `/recuperar-senha` | quando o limite de email do Supabase permitir |
| ~~T10~~ | ~~Vermelho de despesa sobre o card escuro dava 3,71:1~~ | ✅ resolvida na T8 da spec 002 (`#F08084`: 4,68:1 no card; contrastes do card anotados em `globals.css`) | — |
| ~~T11~~ | ✅ resolvida nas migrations `0009`/`0010` da spec 002. ~~FK `(category_id, user_id) on delete set null` da `0001` tentaria anular também o `user_id` (que é `not null`): apagar categoria com transações falha. Corrigir com `on delete set null (category_id)`~~ | migration nova | — |
| T13 | `velos:last-account` e `velos:last-category:*` ficam no `localStorage` depois do "Sair" (o `useSignOut` faz `queryClient.clear()`, que não limpa o storage): num aparelho compartilhado o formulário do próximo usuário vem pré-preenchido com ids do anterior. Só GUIDs, sem dado financeiro, e a API rejeita — mas revela que existiu outra conta ali. Achado da revisão `security` da spec 006 | `web/src/lib/utils/last-used.ts`, `web/src/features/auth/api.ts` | `chore` ou quando mexer no logout |
| T16 | **FI-07 da auditoria:** o teto de R$ 999.999.999,99 existe só no validator da API; o banco tem `> 0` mas não o limite superior | migration nova (0014+) | `chore` |
| T15 | **FI-04 da auditoria:** `goal_contributions.date` ainda tem `default current_date` (que roda em UTC). A API sempre envia a data, então não machuca hoje | migration nova (0014+) | `chore` |
| T14 | Saldo total **negativo** aparece no cartão de verde vivo (tema escuro) com o sinal "−", mas o verde ainda lê como "positivo" num relance. O DESIGN.md diz que verde vivo é *dinheiro*, não *positivo*, então não é violação — é uma escolha a confirmar. Visto ao conferir o CA2 da spec 005 | `web/src/features/dashboard/BalanceCards.tsx` | **A DEFINIR** pelo Pedro |
| T12 | Detalhes da revisão `qa`: texto "10 minutos"/"5 senhas" fixo no front (`SignInForm`, `LockedNotice`) em vez de vir da API; checklist de senha marca ✕ em momentos diferentes no cadastro e na redefinição; `SignInForm.tsx` (157) e `SupabaseAuthClient.cs` (179) acima de ~150 linhas; `result.Error!` repetido; comentários sem acento | `web/src/features/auth/`, `api/` | `chore` ou quando mexer nos arquivos |
