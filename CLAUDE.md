# Velos Wallet

App de gestão financeira pessoal. Tagline: *"Seu dinheiro na direção certa."*
Público: pessoas físicas no Brasil que querem controlar gastos, entender para onde vai o dinheiro e bater metas.

> Este arquivo é lido pelo Claude Code em toda sessão. Mantenha-o curto, atual e verdadeiro.

## Stack

- **Framework:** Next.js 15.5.27 (App Router, Turbopack) + React 19.1 + TypeScript (strict)
  - **Decisão (2026-10-11): ficar no 15**, mesmo existindo o 16.4.0. Risco aceite: o `npm audit` acusa um aviso de `postcss` dentro do próprio `next` cuja correção só saiu no 16. É ferramenta de build sobre CSS que nós próprios escrevemos, logo exposição baixa. Revisitar antes do deploy em produção.
- **UI:** Tailwind CSS **v4** (config CSS-first, sem `tailwind.config.js`) + shadcn/ui + lucide-react + Recharts (gráficos)
  - O primitivo do shadcn hoje é **`@base-ui/react`**, não Radix. Componentes de terceiros (21st.dev) que assumam Radix podem precisar de ajuste.
  - O `cn` vem do pacote `cn`, reexportado em `src/lib/utils.ts`.
- **Backend:** Supabase (Postgres, Auth, Row Level Security) via **`@supabase/ssr`** — nunca `@supabase/auth-helpers-nextjs`, que está descontinuado
- **Validação:** Zod (schemas compartilhados entre form e servidor)
- **Formulários:** React Hook Form + zodResolver
- **Datas:** date-fns com locale `ptBR`
- **Deploy:** Vercel
- **Mobile/desktop:** PWA primeiro (instalável no celular e no PC). App nativo só depois do MVP validado.

## Comandos

```bash
npm run dev        # servidor local em http://localhost:3000
npm run build      # build de produção (rodar antes de considerar uma feature pronta)
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run types:db   # regenera src/types/database.types.ts a partir do Supabase
```

## Estrutura de pastas

```
src/
  app/
    (auth)/          # login, cadastro, recuperar senha
    (app)/           # rotas autenticadas: dashboard, transacoes, categorias, metas, config
    auth/            # route handlers de OAuth e confirmacao de email (exceção necessária:
                     # o fluxo OAuth do Supabase exige um route handler, Server Action não serve)
    api/             # outros route handlers (somente se Server Actions não resolverem)
  components/
    ui/              # componentes shadcn (gerados pelo CLI, não editar à mão sem motivo)
    shared/          # componentes reutilizáveis do app (MoneyInput, CategoryBadge...)
    features/        # componentes por domínio: transacoes/, metas/, dashboard/
  lib/
    env.ts           # leitura validada das variáveis de ambiente
    supabase/        # clients: server.ts, client.ts, middleware.ts
    validations/     # schemas Zod
    utils/           # currency.ts, date.ts  (o cn fica em lib/utils.ts, do shadcn)
  server/
    actions/         # Server Actions por domínio
    queries/         # leituras do banco por domínio
  types/             # tipos globais e tipos gerados do Supabase (database.types.ts)
supabase/
  migrations/        # SQL versionado, um arquivo por mudança
```

## Regras do projeto

### Dinheiro
- **Nunca usar `float` para valores.** Armazenar em **centavos** como `bigint` no banco e `number` inteiro no TS.
- Converter para reais só na exibição com `formatCurrency(cents)` → `R$ 1.234,56`.
- Input de valor sempre com máscara BRL (componente `MoneyInput`); ler com `parseCurrencyInput`, que trabalha só sobre os dígitos e por isso não perde precisão.
- **Somar dinheiro no SQL, não no JS.** `sum()` sobre `bigint` devolve `numeric`, que pode chegar como string — passar tudo por `toCents()` na fronteira do banco. Nunca trazer todas as transações para o cliente só para somar.
- O sinal vem sempre do `type` da transação, nunca de um valor negativo. `amount_cents > 0` é garantido por constraint.

### Datas
- **Nunca `new Date("2026-10-11")`.** O JS interpreta data sem hora como UTC meia-noite, que em UTC-3 é o dia anterior às 21h — a transação do dia 1 apareceria no dia 31. Usar sempre os helpers de `lib/utils/date.ts`, que passam por `parseISO`.

### Banco e segurança
- Toda tabela tem `user_id uuid references auth.users` e **RLS ativado**. **Exceção:** `profiles`, cuja PK já é o id do usuário — lá a policy é `id = (select auth.uid())`.
- Policies **por comando** (select/insert/update/delete) e sempre com `(select auth.uid())` em subquery: assim o planner avalia uma vez por statement em vez de uma vez por linha.
- Toda mudança de schema vira um arquivo em `supabase/migrations/`. Nunca alterar o banco "na mão".
- Toda tabela tem `created_at` e `updated_at`, com trigger para o `updated_at`.
- Depois de mudar o schema, rodar `npm run types:db`.
- Nunca expor a `service_role` key no client. Variáveis públicas só com prefixo `NEXT_PUBLIC_`.

### Código
- TypeScript strict, sem `any`. Se precisar, usar `unknown` + validação.
- Server Components por padrão; `"use client"` só quando houver interatividade. **Recharts é client-only**, logo todo gráfico leva `"use client"`.
- Mutações via **Server Actions** validadas com Zod no servidor.
- Nomes de código em **inglês**; textos da interface em **português do Brasil**.
- Componentes pequenos: se passar de ~150 linhas, quebrar.
- Não instalar biblioteca nova sem explicar o motivo antes.

### Identidade visual

Três cores, extraídas de `velos-perfil-claro.png` / `velos-perfil-escuro.png` (na raiz; cópias servíveis em `public/brand/`):

| | Hex | Papel |
|---|---|---|
| Off-white | `#F4F7F2` | fundo do tema claro |
| Verde profundo | `#0A2E24` | **a marca**: fundo do tema escuro, botões e chrome no claro |
| Verde vivo | `#2ED38C` | **dinheiro e acento**: valores positivos, estados ativos, foco |

- **O verde profundo é a marca; o verde vivo é dinheiro.** Nunca usar o verde vivo como cor de botão principal no tema claro — senão o utilizador deixa de distinguir "isto é a marca" de "isto é receita".
- **`#2ED38C` reprova em contraste no tema claro** (1,80:1 sobre `#F4F7F2`, nos dois sentidos). Por isso receita no tema claro usa `#1C7F54` (4,61:1). No tema escuro o verde vivo já passa (7,57:1) e é usado diretamente.
- Cor de dinheiro só pelos tokens `--income` / `--expense` (utilitários `text-income`, `text-expense`). Nunca `text-emerald-*` ou `text-red-*` soltos.
- Todo par de texto/fundo tem de passar **4,5:1**. Os valores medidos estão em comentário no `globals.css` — ao mexer num token, remedir.

### UI
- Mobile-first: tudo precisa funcionar bem em 375px de largura.
- Tema claro e escuro desde o início. A troca é feita pela classe `.dark` no `<html>`, decidida por um script inline no layout (sem biblioteca) para não haver flash de tema errado.
- Receitas em verde, despesas em vermelho, mas **nunca depender só da cor**: usar sempre também o sinal (`+`/`-`) e/ou ícone.
- Estados de loading (skeleton), vazio e erro em toda lista.

## Modelo de dados (MVP)

- `profiles` — id (= auth.users.id), name, currency (default `BRL`), created_at, updated_at
- `accounts` — id, user_id, name, type (`checking` | `savings` | `cash` | `credit_card`), initial_balance_cents
- `categories` — id, user_id, name, type (`income` | `expense`), color, icon + **UNIQUE (id, type)**
- `transactions` — id, user_id, account_id, category_id?, type (`income` | `expense` | `transfer`), amount_cents, description, date, transfer_account_id?
- `goals` — id, user_id, name, target_cents, deadline
- `goal_contributions` — id, user_id, goal_id, amount_cents, date

Decisões de modelagem:
- **Cartão de crédito** é uma conta normal, mas fica **fora** do "saldo total" (só `checking`/`savings`/`cash`). A dívida aparece em card separado. Sem fatura no MVP.
- **Transferência** é um único registro com conta de origem (`account_id`) e destino (`transfer_account_id`), e é **excluída** dos totais de receita/despesa do mês.
- **`goals` não guarda `current_cents`**: o progresso é derivado da soma de `goal_contributions` (view `goal_progress`).
- A FK composta `(category_id, type) → categories (id, type)` impede uma despesa apontar para categoria de receita.

Views (agregação no SQL): `account_balances`, `monthly_summary`, `goal_progress`.

## Fora do escopo do MVP

Transações recorrentes, compras parceladas, fatura de cartão de crédito e PWA offline-first
(o PWA do MVP é apenas instalável). Não reintroduzir no meio de outra etapa.

## Fluxo de trabalho

1. Para features novas, **planejar antes** (Plan Mode) e esperar aprovação.
2. Implementar uma etapa por vez; ao terminar, parar e esperar aprovação.
3. Ao terminar: rodar `npm run typecheck`, `npm run lint` e `npm run build`. Só dizer que está pronto se os três passarem.
4. Sugerir uma mensagem de commit no padrão Conventional Commits (`feat:`, `fix:`, `refactor:`...).

## Status

- [x] Setup do projeto (Next.js, Tailwind v4, shadcn, clients do Supabase, scripts)
- [x] Identidade visual aplicada aos tokens (tema claro e escuro, contraste verificado)
- [ ] Modelo de dados: migrations, RLS, triggers, seed de categorias, views
- [ ] Autenticação (email/senha com confirmação + Google)
- [ ] Contas e categorias
- [ ] Transações (CRUD + filtros por mês/categoria + transferências)
- [ ] Dashboard (saldo, receitas x despesas do mês, gráfico por categoria)
- [ ] Metas (com aportes manuais)
- [ ] PWA (manifest, ícones, instalável)
