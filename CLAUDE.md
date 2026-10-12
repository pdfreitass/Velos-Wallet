# Velos Wallet

App de gestão financeira pessoal para pessoas físicas no Brasil. Tagline: *"Seu dinheiro na direção certa."*

> Lido pelo Claude Code em toda sessão. Mantenha **curto**: só resumo e regras. Detalhes moram em `docs/`.

## Onde ler o quê

| Situação | Ler |
|---|---|
| **Início de toda sessão** | [docs/ROADMAP.md](docs/ROADMAP.md): onde paramos e o que vem a seguir |
| Antes de começar uma etapa ou feature | [docs/LICOES.md](docs/LICOES.md) + a spec em `docs/specs/NNN-*/` |
| Decidir **se** algo entra no produto | [docs/VISAO.md](docs/VISAO.md) (público, objetivos, fora do escopo) |
| Escrever código, mexer no banco, adicionar dependência | [docs/ARQUITETURA.md](docs/ARQUITETURA.md) (pastas, fluxo de dados, tabelas, RLS) |
| Entender **por que** algo é como é, ou mudar uma decisão | [docs/adr/](docs/adr/) |
| Ver o que já foi entregue | [docs/CHANGELOG.md](docs/CHANGELOG.md) |

## Stack (resumo)

Next.js **15.5.27** (App Router) + React 19.1 + TypeScript strict · Tailwind **v4** + shadcn/ui sobre **`@base-ui/react`** (não Radix) · Supabase via **`@supabase/ssr`** (projeto `khvottmyspapwsdeqqnm`, **sa-east-1**) · date-fns `ptBR` · Zod + React Hook Form + Recharts (planejados) · Vercel · PWA.

## Comandos

```bash
npm run dev                       # http://localhost:3000
npm run typecheck                 # tsc --noEmit
npm run lint                      # ESLint
npm run build                     # build de produção
npx supabase db push --dry-run    # mostra as migrations pendentes
npx supabase db push              # aplica (altera PRODUÇÃO)
npm run types:db                  # regenera src/types/database.types.ts
```

## Regras do projeto

### Dinheiro
- **Nunca `float`.** Centavos: `bigint` no banco, `number` inteiro no TS. O valor é sempre positivo, e o sinal vem do `type`.
- Exibir com `formatCurrency` / `formatSignedCurrency`; ler input com `parseCurrencyInput` (componente `MoneyInput`).
- **Somar no SQL** (views), nunca no JS. Tudo o que vem do banco passa por `toCents()`.

### Datas
- **Nunca `new Date("yyyy-MM-dd")`** (em UTC-3 vira o dia anterior). Usar `parseDbDate` / `toDbDate` de `lib/utils/date.ts`.

### Banco e segurança
- Toda tabela: `user_id` + **RLS** + policies **por comando** com `(select auth.uid())` + `created_at` + `updated_at` com trigger. Exceção: `profiles` (PK = id do usuário).
- Toda view: `with (security_invoker = on)`.
- Schema só muda por **arquivo novo** em `supabase/migrations/`, aplicado com `npx supabase db push`. Nunca editar migration já aplicada nem colar SQL no SQL Editor. Depois: `npm run types:db`.
- App usa só URL + chave **publicável**. Secret key / `service_role` nunca no client, num `NEXT_PUBLIC_*`, num commit ou num chat.
- Infraestrutura nova sempre em **São Paulo** (`sa-east-1` / Vercel `gru1`).

### Código
- TypeScript strict, sem `any` (usar `unknown` + validação).
- Server Components por padrão; `"use client"` só com interatividade (Recharts é sempre client).
- Mutações via **Server Actions** com Zod validado **no servidor**.
- Código em **inglês**; interface em **português do Brasil, com acento**.
- Componente passou de ~150 linhas → quebrar.
- **Não instalar biblioteca nova sem explicar o motivo antes.**

### UI e identidade visual
- **Verde profundo `#0A2E24` é a marca; verde vivo `#2ED38C` é dinheiro.** Nunca verde vivo como botão principal no tema claro.
- Cor de dinheiro só por `text-income` / `text-expense`. Nunca `text-emerald-*` / `text-red-*` soltos.
- Todo par texto/fundo ≥ **4,5:1**; contrastes medidos em comentário no `globals.css` (ao mexer num token, remedir).
- **Nunca depender só da cor**: sempre sinal `+`/`-` e/ou ícone.
- Mobile-first (**375 px**), tema claro e escuro, e estados **loading (skeleton), vazio e erro** em toda lista.

### Escopo
Fora do MVP: recorrência, parcelamento, fatura de cartão, offline-first, app nativo. **Não reintroduzir no meio de outra etapa.**

## Fluxo de trabalho (Spec-Driven Development)

1. **Branch de trabalho: `devpedro`.** Antes de começar, atualizar com a `main`.
2. **Toda feature nova começa por uma spec**: copiar `docs/specs/_template/` para `docs/specs/NNN-nome/` (NNN sequencial, ex.: `001-autenticacao`).
   - `spec.md` (o quê + critérios de aceite) → **esperar aprovação**
   - `plan.md` (como, tecnicamente) → **esperar aprovação**
   - `tasks.md` (passos pequenos e verificáveis)
3. Implementar **uma task por vez**; ao terminar cada uma, parar e mostrar.
4. Decisão nova e relevante → ADR em `docs/adr/` a partir do `0000-template.md`.
5. Só dizer que está pronto se `npm run typecheck`, `npm run lint` e `npm run build` passarem.
6. **Ao terminar a feature**, atualizar [ROADMAP](docs/ROADMAP.md), [CHANGELOG](docs/CHANGELOG.md) e [LICOES](docs/LICOES.md).
7. Commits em Conventional Commits (`feat:`, `fix:`, `docs:`…), um assunto por commit. PR para `main` via `gh pr create`, com descrição e checklist de testes.
