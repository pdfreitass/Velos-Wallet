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

Desde o [ADR 0013](docs/adr/0013-api-aspnet-e-front-react-vite.md):

- **API** (`api/`): ASP.NET Core **.NET 10**, Clean Architecture (`Domain` → `Application` → `Infrastructure` → `Api`), FluentValidation, xUnit.
- **Front** (`web/`): React + **Vite** + TypeScript strict · Tailwind **v4** + shadcn/ui sobre **`@base-ui/react`** (não Radix) · Zod + React Hook Form · date-fns `ptBR` · Recharts (planejado) · PWA.
- **Supabase** (projeto `khvottmyspapwsdeqqnm`, **sa-east-1**): Postgres + Auth, **chamado só pela API**. Em produção a API serve o build do front, na **mesma origem**.

## Comandos

```bash
dotnet run --project api/src/Velos.Api   # API em http://localhost:5080
npm run dev --prefix web                 # front em http://localhost:3000 (proxy para a API)
dotnet build api && dotnet test api      # compila e testa a API
npm run typecheck --prefix web           # tsc --noEmit
npm run lint --prefix web                # ESLint
npm run build --prefix web               # build de produção do front
npx supabase db push --dry-run           # mostra as migrations pendentes
npx supabase db push                     # aplica (altera PRODUÇÃO)
```

## Regras do projeto

### Dinheiro
- **Nunca `float`/`double`/`decimal` para guardar dinheiro.** Centavos: `bigint` no banco, `long` no C#, `number` inteiro no TS. O valor é sempre positivo, e o sinal vem do `type`.
- Exibir com `formatCurrency` / `formatSignedCurrency`; ler input com `parseCurrencyInput` (componente `MoneyInput`).
- **Somar no SQL** (views), nunca no C# nem no JS.

### Datas
- `date` do banco ↔ **`DateOnly`** no C# ↔ string `"yyyy-MM-dd"` no JSON.
- No front, **nunca `new Date("yyyy-MM-dd")`** (em UTC-3 vira o dia anterior). Usar `parseDbDate` / `toDbDate` de `web/src/lib/utils/date.ts`.

### Banco e segurança
- Toda tabela: `user_id` + **RLS** + policies **por comando** com `(select auth.uid())` + `created_at` + `updated_at` com trigger. Exceção: `profiles` (PK = id do usuário).
- Toda view: `with (security_invoker = on)`.
- Schema só muda por **arquivo novo** em `supabase/migrations/`, aplicado com `npx supabase db push`. Nunca editar migration já aplicada nem colar SQL no SQL Editor. **O EF Core não gera migrations**: só mapeia.
- **Toda query com dados do usuário roda numa transação com `role authenticated` + claims do JWT** (a RLS vale). Além disso, a `Application` sempre filtra pelo usuário autenticado.
- A API conecta com um role **sem `bypassrls`**. Secret key, `service_role`, senha do banco e connection string nunca no front, num commit ou num chat (dev: `dotnet user-secrets`).
- O front **não fala com o Supabase**: só com a API. Sessão em cookie `httpOnly`, nunca em `localStorage`.
- Toda rota da API é **privada por padrão** (`FallbackPolicy`); rota pública exige `[AllowAnonymous]` explícito.
- Infraestrutura nova sempre em **São Paulo** (`sa-east-1`, Azure *Brazil South* ou Fly.io `gru`).

### Código
- **C#:** `Nullable` e `TreatWarningsAsErrors` ligados; dependências só para dentro (`Domain` não conhece ninguém, `Application` não conhece `Infrastructure` nem `Api`). Validação de entrada com **FluentValidation na `Application`**. Erros como `ProblemDetails`, sem vazar mensagem do Supabase.
- **TypeScript:** strict, sem `any` (usar `unknown` + validação). Zod no front é só para a experiência do usuário; quem decide é a API.
- Código em **inglês**; interface e mensagens de erro em **português do Brasil, com acento**.
- Componente React ou classe C# passou de ~150 linhas → quebrar.
- **Não instalar biblioteca nova (NuGet ou npm) sem explicar o motivo antes.**

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
5. Só dizer que está pronto se `dotnet build api`, `dotnet test api` e `typecheck`, `lint` e `build` do `web` passarem.
6. **Ao terminar a feature**, atualizar [ROADMAP](docs/ROADMAP.md), [CHANGELOG](docs/CHANGELOG.md) e [LICOES](docs/LICOES.md).
7. Commits em Conventional Commits (`feat:`, `fix:`, `docs:`…), um assunto por commit. PR para `main` via `gh pr create`, com descrição e checklist de testes.
