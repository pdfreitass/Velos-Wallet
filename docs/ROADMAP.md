# Roadmap

> Leia no **início de cada sessão** para saber onde paramos.
> Atualize **ao terminar cada feature** (junto com [CHANGELOG.md](CHANGELOG.md) e [LICOES.md](LICOES.md)).

**Progresso do MVP: 2 de 8 etapas (25%)** — atualizado em 2026-10-13.

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

### Página inicial ([spec 003](specs/003-pagina-inicial/tasks.md))
- Página pública em `/` (composição "Tudo converge"): as contas ligadas por fios ao iPhone desenhado em código, 4 telas trocáveis, seções com o iPhone fixo no desktop, faixa "Privado por padrão", fechamento "Sem loja de apps."
- Mesmo iPhone, compacto, no painel das telas de entrada; logado em `/` vai ao painel
- Telas do app em `lazy()`: pacote inicial 99 KB gzip; Lighthouse no celular 93–96 / acessibilidade 100
- `DESIGN.md` do sistema visual (Impeccable)

## 🟡 Em andamento

**Etapa 3 — Autenticação** ([spec 001](specs/001-autenticacao/tasks.md)). Em 2026-10-12 a stack mudou para **API ASP.NET + React/Vite** ([ADR 0013](adr/0013-api-aspnet-e-front-react-vite.md)). Feito até 2026-10-13: T10–T17 (front e API, banco pela API com o role `velos_api`, cadastro/entrar/sair reais, bloqueio de tentativas com aviso e contagem na tela). **Próxima: T18** (modelos de email + C3/C6 no painel do Supabase), depois T19 (recuperação de senha: hoje "Esqueci minha senha" e "Redefinir minha senha" levam a uma rota que ainda não existe) e T20 (Google). **Não fazer merge na `main` antes da T19 e da T20.**

## ⬜ Pendente

| Etapa | Escopo | Depende de |
|---|---|---|
| **3 — Autenticação** | Falta: emails (T18), recuperação de senha (T19), Google (T20), ADRs 0014/0015, critérios de aceite e agentes `security`/`qa` (T21–T24), docs e PR (T25–T26) | 2 |
| **4 — Contas e categorias** | CRUD de contas (4 tipos) e categorias (cor + ícone), `MoneyInput`, `CategoryBadge` | 3 |
| **5 — Transações** | CRUD, filtro por mês/categoria, transferências entre contas | 4 |
| **6 — Dashboard** | Saldo total (sem cartão), card de dívida do cartão, receitas × despesas do mês, gráfico por categoria (Recharts); conteúdo real do `/painel` e layout para desktop | 5 |
| **7 — Metas** | CRUD de metas, aportes manuais, barra de progresso via `goal_progress` | 3 |
| **8 — PWA** | `manifest.webmanifest`, ícones, instalável no celular e no PC (sem offline-first) | 6 |

**Antes do deploy em produção** (sem etapa própria ainda — **A DEFINIR** quando entra):
- Escolher o host do app (API + SPA num processo só) em São Paulo: Azure *Brazil South* ou Fly.io `gru` — [ADR 0013](adr/0013-api-aspnet-e-front-react-vite.md); HTTPS/HSTS e connection string como variável de ambiente
- Resend + domínio próprio e **religar a confirmação de email** (Revisão 1 da spec 001). Junto com o Resend vão **os modelos de email** de `supabase/templates/` (passo C3): desde 2026-10-13 o Supabase exige SMTP próprio para editar modelo, então até lá o email de recuperação sai no padrão dele, em inglês e sem logo
- URLs de redirect do Supabase Auth para o domínio final

## Pendências técnicas

Coisas pequenas encontradas pelo caminho. Resolver na etapa indicada ou numa PR de `chore`.

| # | Pendência | Onde | Quando |
|---|---|---|---|
| T1 | `goal_contributions` não tem `updated_at` nem trigger, o que viola a regra "toda tabela tem `updated_at`" | migration nova (a próxima livre; `0005`–`0007` já foram usadas) | antes da Etapa 7 |
| ~~T2~~ | ~~`supabase/migrations/.gitkeep` gera o aviso "Skipping migration .gitkeep"~~ | ✅ arquivo removido na limpeza de 2026-10-15 | — |
| ~~T3~~ | ~~Textos de UI sem acento~~ | ✅ resolvida na T10 da spec 001 (`web/index.html` e página provisória com acento) | — |
| ~~T4~~ | ~~`hasSupabaseEnv()` do middleware~~ | ✅ obsoleta: o middleware do Next saiu na troca de stack (ADR 0013) | — |
| ~~T5~~ | ~~Imagens padrão do create-next-app sem uso~~ | ✅ removidas na T10 da spec 001 (`e4da686`) | — |
| T7 | Fios das seções da página inicial apontam para o iPhone fixo, mas não chegam à linha exata da tela (revisor de acabamento: "parcial") | `web/src/features/landing/StepArtifacts.tsx` | **A DEFINIR** pelo Pedro |
| T8 | Botões de 32–40 px abaixo do alvo de 44 px do PRODUCT.md (Button padrão, "Entrar" do cabeçalho); `--sidebar-ring` claro em #2ED38C (1,80:1, ainda sem uso) | `web/src/components/ui/button.tsx`, `globals.css` | Etapa 4 |
| ~~T6~~ | ~~Logos originais duplicados na raiz~~ | ✅ movidos para `media/brand/` na limpeza de 2026-10-15 (`web/public/brand/` segue sendo o que o app usa) | — |
