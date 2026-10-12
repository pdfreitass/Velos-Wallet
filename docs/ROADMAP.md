# Roadmap

> Leia no **início de cada sessão** para saber onde paramos.
> Atualize **ao terminar cada feature** (junto com [CHANGELOG.md](CHANGELOG.md) e [LICOES.md](LICOES.md)).

**Progresso do MVP: 2 de 8 etapas (25%)** — atualizado em 2026-10-12.

> **Numeração:** são 8 etapas, a mesma que os comentários do código já usam ("Etapa 2" = banco, "Etapa 3" = autenticação, "Etapa 6" = dashboard). A identidade visual faz parte da Etapa 1. O checklist antigo do `CLAUDE.md` tinha 9 itens porque contava a identidade visual à parte.

## ✅ Pronto

### Etapa 1 — Setup do projeto
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

## 🟡 Em andamento

Nada. A próxima etapa é a **3 — Autenticação**, que começa por `docs/specs/001-autenticacao/`.

## ⬜ Pendente

| Etapa | Escopo | Depende de |
|---|---|---|
| **3 — Autenticação** | Email/senha com confirmação + Google, rotas `(auth)`, route handler em `app/auth/`, proteção de `(app)/*` no middleware, logout | 2 |
| **4 — Contas e categorias** | CRUD de contas (4 tipos) e categorias (cor + ícone), `MoneyInput`, `CategoryBadge`; instalar Zod + React Hook Form | 3 |
| **5 — Transações** | CRUD, filtro por mês/categoria, transferências entre contas | 4 |
| **6 — Dashboard** | Saldo total (sem cartão), card de dívida do cartão, receitas × despesas do mês, gráfico por categoria (Recharts); substitui a `page.tsx` temporária | 5 |
| **7 — Metas** | CRUD de metas, aportes manuais, barra de progresso via `goal_progress` | 3 |
| **8 — PWA** | `manifest.webmanifest`, ícones, instalável no celular e no PC (sem offline-first) | 6 |

**Antes do deploy em produção** (sem etapa própria ainda — **A DEFINIR** quando entra):
- Configurar projeto na Vercel (região `gru1`) e as variáveis de ambiente
- Rever a decisão de ficar no Next 15 (aviso do `postcss` no `npm audit`, corrigido só no 16) — [ADR 0001](adr/0001-nextjs-15-app-router.md)
- URLs de redirect do Supabase Auth para o domínio final

## Pendências técnicas

Coisas pequenas encontradas pelo caminho. Resolver na etapa indicada ou numa PR de `chore`.

| # | Pendência | Onde | Quando |
|---|---|---|---|
| T1 | `goal_contributions` não tem `updated_at` nem trigger, o que viola a regra "toda tabela tem `updated_at`" | migration `0005` | antes da Etapa 7 |
| T2 | `supabase/migrations/.gitkeep` gera o aviso "Skipping migration .gitkeep" em todo comando do CLI | apagar o arquivo (a pasta já tem conteúdo) | qualquer `chore` |
| T3 | Textos de UI sem acento: `"Seu dinheiro na direcao certa."` (metadata e `page.tsx`), `"Acao principal"`, `"Secundaria"` | `layout.tsx`, `page.tsx` | Etapa 3 (o metadata é real; a `page.tsx` some na Etapa 6) |
| T4 | Comentário do `middleware.ts` diz "A partir da Etapa 3 as chaves são obrigatórias", mas o `hasSupabaseEnv()` ainda deixa passar sem chaves | `lib/supabase/middleware.ts` | Etapa 3 |
| T5 | Imagens padrão do create-next-app sem uso (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`) | `public/` | qualquer `chore` |
| T6 | Logos originais duplicados na raiz (`velos-perfil-*.png`) e em `public/brand/` (`velos-*.png`) | raiz | **A DEFINIR**: manter na raiz como fonte? |
