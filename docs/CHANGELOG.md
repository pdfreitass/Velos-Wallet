# Changelog

> Histórico de entregas, do mais recente para o mais antigo.
> Formato inspirado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Ainda não há versões publicadas, por isso as entradas são agrupadas por data e etapa.
> Atualize **ao terminar cada feature**, junto com o [ROADMAP](ROADMAP.md).

## [Não lançado]

### 2026-10-12 — Cores revisadas pelo Pedro (spec 003)
#### Alterado
- Verde escuro passa a ser o tema padrão de quem ainda não escolheu ([ADR 0016](adr/0016-verde-escuro-como-tema-padrao.md)); a barra do navegador acompanha o tema aplicado.
- Tela do iPhone da vitrine sempre no tema oposto ao da página, para o aparelho nunca se misturar com o fundo.
- Tema claro menos branco: fundo `#ECF1EA` (antes `#F4F7F2`) e cartões `#F5F8F3` (antes `#FFFFFF`). Para manter tudo ≥ 4,5:1, escureceram muted `#576E66`, despesa `#C1393E`, receita e foco `#197A50` e borda de campo `#738880` (3,30:1).
- Painel das telas de entrada: promessas logo abaixo da frase e, a partir de 1280 px, três cartões do app (salário, mercado, meta) flutuando na moldura do iPhone.

### 2026-10-12 — Página inicial (spec 003)
#### Adicionado
- Página pública em `/`: composição "Tudo converge" (quatro contas ligadas por fios ao iPhone desenhado em CSS), abas acessíveis Contas · Mês · Gastos · Metas, número que rola como contador, seções com o iPhone fixo no desktop, faixa "Privado por padrão" em tema invertido, fechamento "Sem loja de apps.", barra fixa "Criar conta" no celular, rodapé com @veloswallet.
- Vitrine do app reutilizável em `web/src/features/showcase/` (tamanhos hero, compact, peek e mini), com dados de exemplo rotulados.
- `DESIGN.md` e `.impeccable/design.json`: o sistema visual documentado a partir do código.
#### Alterado
- Painel das telas de entrada: o bloco de contas virou o iPhone compacto com abas.
- `/` para visitante mostra a página; logado vai ao painel (`GuestOnly`); `RootRedirect` removido.
- Entrar, cadastro, painel e 404 carregam sob demanda (`lazy()`).
- `ThemeToggle` ganhou a variante só com ícone.
#### Corrigido
- Linha destacada no iPhone não troca mais o fundo (o vermelho da dívida sobre card escuro dava 3,71:1).

### 2026-10-12 — Documentação SDD
#### Adicionado
- Pasta `docs/` no padrão Spec-Driven Development: `VISAO`, `ARQUITETURA`, `ROADMAP`, `LICOES`, `CHANGELOG`, 12 ADRs e templates de spec/plan/tasks.
#### Alterado
- `CLAUDE.md` enxugado: as regras ficam, os detalhes passam para `docs/`, com indicação de qual arquivo ler em cada situação.
- Etapas renumeradas para 8, alinhadas com os comentários do código.

### 2026-10-12 — Etapa 2 concluída: banco em produção (PR #1)
#### Adicionado
- `supabase` CLI como devDependency (`407d349`).
- `database.types.ts` gerado do schema real: 6 tabelas, 3 views, 2 enums (`bf0e188`).
#### Alterado
- Projeto Supabase recriado em **sa-east-1 (São Paulo)**; o anterior, em us-west-2, foi descartado ainda vazio (`bf0e188`).
- Migrations `0001`–`0004` aplicadas via `supabase db push`, com histórico registrado.
- `types:db` usa `--linked` em vez de `$SUPABASE_PROJECT_ID`, que não funcionava no Windows (`407d349`).
- `CLAUDE.md`: projeto/região, comando `db push`, regra de nunca colar migrations no SQL Editor (`8d4a4a6`).
#### Corrigido
- Histórico local integrado ao "Initial commit" criado pelo GitHub, sem `push --force` (`de4bda8`).
#### Segurança
- RLS verificada na prática: sem sessão, `categories`, `transactions` e `account_balances` devolvem `[]`.

### 2026-10-11 — Etapa 2: migrations escritas (`0f7455b`)
#### Adicionado
- `0001_init.sql`: tabelas `profiles`, `accounts`, `categories`, `transactions`, `goals`, `goal_contributions`; enums `account_type` e `transaction_type`; índices.
- FK composta `(category_id, type)` impede despesa em categoria de receita; FKs `(account_id, user_id)` impedem usar conta alheia; CHECK de forma da transferência.
- `0002_rls.sql`: RLS nas 6 tabelas, 23 policies por comando com `(select auth.uid())`.
- `0003_triggers_seed.sql`: `set_updated_at` e `handle_new_user` (profile + 10 categorias padrão).
- `0004_views.sql`: `account_balances`, `monthly_summary`, `goal_progress`, todas com `security_invoker = on`.

### 2026-10-11 — Etapa 1: setup do projeto (`e6174fa`)
#### Adicionado
- Next.js 15.5.27 + React 19.1 + TypeScript strict, App Router com Turbopack.
- Tailwind v4 (CSS-first) e shadcn/ui sobre `@base-ui/react`.
- Clients Supabase via `@supabase/ssr` (browser, server, middleware de sessão).
- Identidade visual nos tokens: `#0A2E24` marca, `#2ED38C` dinheiro, `#F4F7F2` fundo; `--income`/`--expense` com contraste WCAG verificado nos dois temas.
- `formatCurrency`, `formatSignedCurrency`, `parseCurrencyInput`, `toCents` (centavos, sem float).
- Helpers de data com `parseISO`, evitando o desvio de fuso em UTC-3.
- Tema claro/escuro por script inline + `ThemeToggle`, sem dependência extra.
- Scripts `typecheck`, `lint` e `types:db`.

### 2026-10-11 — Início
- Repositório inicializado (`664ec49`).
- `CLAUDE.md` com stack, regras e modelo de dados (`e951555`).
