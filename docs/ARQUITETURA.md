# Arquitetura

> Leia este arquivo antes de criar código novo, mexer no banco ou adicionar dependência.
> As regras obrigatórias resumidas ficam no [CLAUDE.md](../CLAUDE.md); aqui está o **porquê** e o **mapa**.
> Decisões individuais têm o seu registro em [adr/](adr/).

## Stack

| Camada | Tecnologia | Estado | ADR |
|---|---|---|---|
| Framework | Next.js **15.5.27** (App Router, Turbopack) + React 19.1 | instalado | [0001](adr/0001-nextjs-15-app-router.md) |
| Linguagem | TypeScript strict, sem `any` | instalado | — |
| Estilo | Tailwind CSS **v4** (CSS-first, sem `tailwind.config.js`) | instalado | [0005](adr/0005-tailwind-v4-shadcn-base-ui.md) |
| Componentes | shadcn/ui (estilo `base-nova`) sobre **`@base-ui/react`** + lucide-react | instalado (`button`, `card`) | [0005](adr/0005-tailwind-v4-shadcn-base-ui.md) |
| Backend | Supabase (Postgres 17, Auth, RLS) via **`@supabase/ssr`** | instalado | [0002](adr/0002-supabase-ssr-rls.md) |
| Datas | date-fns 4 com locale `ptBR` | instalado | — |
| Validação | Zod (schemas compartilhados entre form e servidor) | **planejado**, não instalado | — |
| Formulários | React Hook Form + `zodResolver` | **planejado**, não instalado | — |
| Gráficos | Recharts (client-only) | **planejado**, não instalado | — |
| CLI do banco | `supabase` 2.120 (devDependency) | instalado | [0012](adr/0012-migrations-via-supabase-cli.md) |
| Deploy | Vercel | **não configurado** | — |

## Estrutura de pastas

Estado real em 2026-10-12. Pastas marcadas com `(vazia)` existem só com `.gitkeep`.

```
src/
  app/
    layout.tsx          # <html lang="pt-BR">, fontes Geist, script inline de tema
    page.tsx            # página TEMPORÁRIA de validação do setup (vira o dashboard na Etapa 6)
    globals.css         # tokens de cor (claro/escuro) com contrastes medidos em comentário
    (auth)/             # (a criar na Etapa 3) login, cadastro, recuperar senha
    (app)/              # (a criar) rotas autenticadas: dashboard, transacoes, categorias, metas, config
    auth/               # (a criar na Etapa 3) route handlers de OAuth / confirmação de email
                        #   exceção necessária: o fluxo OAuth exige route handler, Server Action não serve
    api/                # (só se Server Actions não resolverem) outros route handlers
  middleware.ts         # chama updateSession em toda rota exceto estáticos
  components/
    ui/                 # shadcn gerado pelo CLI: button.tsx, card.tsx
    shared/             # ThemeToggle.tsx
    features/           # (vazia) componentes por domínio
  lib/
    env.ts              # leitura validada e PREGUIÇOSA das variáveis públicas
    supabase/           # client.ts (browser), server.ts (RSC/Actions), middleware.ts (sessão)
    utils/              # currency.ts, date.ts
    utils.ts            # reexporta `cn` do pacote `cn`
    validations/        # (vazia) schemas Zod
  server/
    actions/            # (vazia) Server Actions por domínio
    queries/            # (vazia) leituras do banco por domínio
  types/
    database.types.ts   # GERADO por `npm run types:db` — não editar à mão
supabase/
  migrations/           # 0001_init, 0002_rls, 0003_triggers_seed, 0004_views
public/brand/           # velos-claro.png, velos-escuro.png
docs/                   # esta documentação (SDD)
```

## Fluxo de dados

### Leitura (padrão)

```
Server Component (app/(app)/.../page.tsx)
  └─ server/queries/<dominio>.ts
       └─ createClient() de lib/supabase/server.ts   ← novo client POR REQUEST
            └─ SELECT em tabela ou VIEW (a RLS filtra pelo usuário)
                 └─ toCents() na fronteira → number inteiro
                      └─ formatCurrency() só na hora de exibir
```

- Somas e agregações **sempre no SQL** (views), nunca trazendo todas as linhas para o JS.
- `sum()` sobre `bigint` devolve `numeric`, que pode chegar como string. As views já fazem cast para `bigint`, e `toCents()` é a rede de segurança.

### Escrita (planejado, a partir da Etapa 4)

```
Client Component com React Hook Form + zodResolver(schema)
  └─ Server Action em server/actions/<dominio>.ts
       └─ schema.parse() DE NOVO no servidor (o client não é confiável)
            └─ insert/update via lib/supabase/server.ts
                 └─ RLS + constraints do banco validam por último
                      └─ revalidatePath() da rota afetada
```

### Sessão

1. `src/middleware.ts` roda em toda request (exceto `_next/static`, `_next/image` e imagens).
2. `lib/supabase/middleware.ts#updateSession` chama `supabase.auth.getUser()`, que **renova o token** e reescreve os cookies.
3. Se as variáveis do Supabase não existirem, o middleware deixa passar (degradação da Etapa 1).
4. **Proteção de rotas ainda não existe.** Entra na Etapa 3 (redirecionar `(app)/*` para login quando não houver sessão).

## Supabase

| | |
|---|---|
| Projeto | `veloswallet` — ref `khvottmyspapwsdeqqnm` |
| Região | **sa-east-1 (São Paulo)** — [ADR 0003](adr/0003-regiao-sa-east-1.md) |
| Postgres | 17 |
| Plano | Free (limite de 2 projetos ativos por organização) |
| Vínculo local | `npx supabase link --project-ref khvottmyspapwsdeqqnm` (grava em `supabase/.temp/`, fora do git) |

### Enums

- `account_type`: `checking` · `savings` · `cash` · `credit_card`
- `transaction_type`: `income` · `expense` · `transfer` (um só enum para categorias e transações, para a FK composta funcionar)

### Tabelas

Todas em `public`, todas com RLS ligada. Valores de dinheiro em `bigint` de **centavos**.

| Tabela | Colunas principais | Regras no banco |
|---|---|---|
| `profiles` | `id` (= `auth.users.id`), `name`, `currency` (default `BRL`) | Criada pelo trigger `handle_new_user`. Sem policy de DELETE: morre em cascata com o usuário. |
| `accounts` | `user_id`, `name`, `type`, `initial_balance_cents` | Só `credit_card` pode ter saldo inicial negativo. `UNIQUE (id, user_id)` para FKs compostas. |
| `categories` | `user_id`, `name`, `type`, `color` (`#RRGGBB`), `icon` (nome lucide) | `type <> 'transfer'`. `UNIQUE (id, type)` e `UNIQUE (user_id, name, type)`. |
| `transactions` | `user_id`, `account_id`, `category_id?`, `type`, `amount_cents`, `description?`, `date`, `transfer_account_id?` | `amount_cents > 0`. FK `(category_id, type)` impede despesa em categoria de receita. FKs `(account_id, user_id)` impedem usar conta alheia. CHECK de forma da transferência. |
| `goals` | `user_id`, `name`, `target_cents`, `deadline?` | `target_cents > 0`. Não guarda progresso. |
| `goal_contributions` | `user_id`, `goal_id`, `amount_cents`, `date` | `amount_cents > 0`. ⚠️ **Sem `updated_at`** (ver [ROADMAP](ROADMAP.md#pendências-técnicas)). |

Índices: `user_id` em todas, `(user_id, date desc)` em `transactions`, e índices nas FKs de conta/categoria/meta.

### Views

Todas com **`security_invoker = on`**: sem isso a view rodaria com as permissões do dono e **ignoraria a RLS**, devolvendo dados de todos os usuários.

| View | Devolve |
|---|---|
| `account_balances` | `balance_cents` = saldo inicial + receitas − despesas − transferências de saída + transferências de entrada |
| `monthly_summary` | `income_cents` e `expense_cents` por `user_id` e `month`, **excluindo transferências** |
| `goal_progress` | `current_cents` = soma dos aportes de cada meta |

O "saldo total" do app soma apenas contas `checking`/`savings`/`cash`. O cartão de crédito aparece em card separado ([ADR 0007](adr/0007-transferencia-registro-unico-e-cartao.md)).

### RLS

- 23 policies: 3 em `profiles` (select/insert/update) + 4 × 5 nas demais (select/insert/update/delete).
- Sempre **por comando** e com `(select auth.uid())` em subquery, para o planner avaliar uma vez por statement.
- Policies de UPDATE têm `USING` **e** `WITH CHECK`, o que impede "doar" uma linha a outro usuário.
- Todas `to authenticated`: o papel `anon` não lê nada (verificado: a chave publicável sem sessão recebe `[]`).

### Triggers e funções

| Função | Quando | O que faz |
|---|---|---|
| `set_updated_at()` | `BEFORE UPDATE` em profiles, accounts, categories, transactions, goals | `updated_at = now()` |
| `handle_new_user()` | `AFTER INSERT` em `auth.users` | Cria o `profile` (nome vindo de `full_name` → `name` → parte do email → "Você") e as **10 categorias padrão** |

Categorias padrão — despesa: Alimentação, Moradia, Transporte, Saúde, Lazer, Educação, Outros · receita: Salário, Freelance, Outros.

Todas as funções usam `set search_path = ''` e nomes totalmente qualificados (proteção contra sequestro de `search_path` em `SECURITY DEFINER`).

### Auth (planejado — Etapa 3)

- Email/senha **com confirmação** + **Google OAuth**.
- O callback OAuth e a confirmação de email exigem **route handler** em `src/app/auth/` (Server Action não serve para esse fluxo).
- **A DEFINIR:** URLs de redirect permitidas no painel (localhost + domínio de produção), template/idioma dos emails de confirmação e se haverá SMTP próprio.

## Dinheiro, datas e tema

| Assunto | Onde | Regra |
|---|---|---|
| Formatar valor | `lib/utils/currency.ts#formatCurrency` | `123456` → `R$ 1.234,56` |
| Valor com sinal | `formatSignedCurrency(cents, "in" \| "out")` | O sinal vem do tipo, nunca do número |
| Ler input | `parseCurrencyInput` | Usa só os dígitos, sem float |
| Fronteira do banco | `toCents` | Aceita `number \| string \| null` |
| Data do banco | `lib/utils/date.ts#parseDbDate` | `parseISO` (hora local), **nunca** `new Date("yyyy-MM-dd")` |
| Gravar data | `toDbDate` | `Date` → `"yyyy-MM-dd"` |
| Tema | `app/layout.tsx` (script inline) + `components/shared/ThemeToggle.tsx` | Classe `.dark` no `<html>`, escolha em `localStorage["theme"]` |

## Identidade visual (tokens)

Definidos em `src/app/globals.css`, com o contraste medido em comentário ao lado de cada token.

| Token | Claro | Escuro |
|---|---|---|
| `--background` | `#F4F7F2` | `#0A2E24` |
| `--foreground` | `#0A2E24` (13,60:1) | `#F4F7F2` (13,60:1) |
| `--income` | `#1C7F54` (4,61:1) | `#2ED38C` (7,57:1) |
| `--expense` | `#CA3F44` (4,51:1) | `#E96368` (4,51:1) |

## Integrações

| Serviço | Uso | Estado |
|---|---|---|
| Supabase | Banco, Auth, RLS | ✅ ativo (sa-east-1) |
| GitHub | `pdfreitass/Velos-Wallet`, PRs para `main` | ✅ ativo |
| Vercel | Deploy | ⬜ **A DEFINIR**: criar projeto e fixar a região das functions em `gru1` (São Paulo) para ficar perto do banco |
| Google Cloud | OAuth client para login com Google | ⬜ Etapa 3 |

## Variáveis de ambiente

| Variável | Onde | Observação |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` / Vercel | `https://khvottmyspapwsdeqqnm.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` / Vercel | Chave **publicável** (`sb_publishable_…`). Pode ir para o browser. |

A **secret key** (`sb_secret_…`) não é usada pelo app e **nunca** pode ter prefixo `NEXT_PUBLIC_` nem ser colada em chat/issue/commit.

`lib/env.ts` valida de forma **preguiçosa** (getters): o `next build` não quebra numa máquina sem `.env.local`, e o erro só aparece na primeira chamada que precisa da chave.
