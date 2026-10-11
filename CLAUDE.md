# Velos Wallet

App de gestão financeira pessoal. Tagline: *"Seu dinheiro na direção certa."*
Público: pessoas físicas no Brasil que querem controlar gastos, entender para onde vai o dinheiro e bater metas.

> Este arquivo é lido pelo Claude Code em toda sessão. Mantenha-o curto, atual e verdadeiro.

## Stack

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript (strict)
- **UI:** Tailwind CSS + shadcn/ui (Radix) + lucide-react (ícones) + Recharts (gráficos)
- **Backend:** Supabase (Postgres, Auth, Row Level Security)
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
```

## Estrutura de pastas

```
src/
  app/
    (auth)/          # login, cadastro, recuperar senha
    (app)/           # rotas autenticadas: dashboard, transacoes, categorias, metas, config
    api/             # route handlers (somente se Server Actions não resolverem)
  components/
    ui/              # componentes shadcn (gerados pelo CLI, não editar à mão sem motivo)
    shared/          # componentes reutilizáveis do app (MoneyInput, CategoryBadge...)
    features/        # componentes por domínio: transacoes/, metas/, dashboard/
  lib/
    supabase/        # clients: server.ts, client.ts, middleware.ts
    validations/     # schemas Zod
    utils/           # formatCurrency, formatDate, cn
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
- Input de valor sempre com máscara BRL (componente `MoneyInput`).

### Banco e segurança
- Toda tabela tem `user_id uuid references auth.users` e **RLS ativado** com policy `user_id = auth.uid()`.
- Toda mudança de schema vira um arquivo em `supabase/migrations/`. Nunca alterar o banco "na mão".
- Depois de mudar o schema, regenerar `src/types/database.types.ts`.
- Nunca expor a `service_role` key no client. Variáveis públicas só com prefixo `NEXT_PUBLIC_`.

### Código
- TypeScript strict, sem `any`. Se precisar, usar `unknown` + validação.
- Server Components por padrão; `"use client"` só quando houver interatividade.
- Mutações via **Server Actions** validadas com Zod no servidor.
- Nomes de código em **inglês**; textos da interface em **português do Brasil**.
- Componentes pequenos: se passar de ~150 linhas, quebrar.
- Não instalar biblioteca nova sem explicar o motivo antes.

### UI
- Mobile-first: tudo precisa funcionar bem em 375px de largura.
- Suporte a tema claro e escuro desde o início (classes `dark:` do Tailwind).
- Receitas em verde, despesas em vermelho, mas nunca depender só da cor (usar ícone/sinal também).
- Estados de loading (skeleton), vazio e erro em toda lista.

## Modelo de dados (MVP)

- `profiles` — id (= auth.users.id), name, currency (default `BRL`), created_at
- `accounts` — id, user_id, name, type (`checking` | `savings` | `cash` | `credit_card`), initial_balance_cents
- `categories` — id, user_id, name, type (`income` | `expense`), color, icon
- `transactions` — id, user_id, account_id, category_id, type, amount_cents, description, date, created_at
- `goals` — id, user_id, name, target_cents, current_cents, deadline

## Fluxo de trabalho

1. Para features novas, **planejar antes** (Plan Mode) e esperar aprovação.
2. Implementar uma feature por vez.
3. Ao terminar: rodar `npm run typecheck`, `npm run lint` e `npm run build`. Só dizer que está pronto se os três passarem.
4. Sugerir uma mensagem de commit no padrão Conventional Commits (`feat:`, `fix:`, `refactor:`...).

## Status

- [ ] Setup do projeto (Next.js, Tailwind, shadcn, Supabase)
- [ ] Autenticação (email/senha + Google)
- [ ] Contas e categorias (com categorias padrão no primeiro login)
- [ ] Transações (CRUD + filtros por mês/categoria)
- [ ] Dashboard (saldo, receitas x despesas do mês, gráfico por categoria)
- [ ] Metas
- [ ] PWA (manifest, ícones, instalável)
