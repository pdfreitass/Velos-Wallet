# Arquitetura

> Leia este arquivo antes de criar código novo, mexer no banco ou adicionar dependência.
> As regras obrigatórias resumidas ficam no [CLAUDE.md](../CLAUDE.md); aqui está o **porquê** e o **mapa**.
> Decisões individuais têm o seu registro em [adr/](adr/).

## Stack

Desde o [ADR 0013](adr/0013-api-aspnet-e-front-react-vite.md) (2026-10-12). Estado real: **em migração** (Etapa 3, Revisão 2 do plano da spec 001).

| Camada | Tecnologia | Estado | ADR |
|---|---|---|---|
| API | ASP.NET Core **.NET 10**, Clean Architecture, Controllers | a criar (T11) | [0013](adr/0013-api-aspnet-e-front-react-vite.md) |
| Acesso a dados | EF Core + Npgsql, **sem migrations** (só mapeia) | a criar (T13) | [0013](adr/0013-api-aspnet-e-front-react-vite.md) |
| Validação (API) | FluentValidation na `Application` | a criar | [0013](adr/0013-api-aspnet-e-front-react-vite.md) |
| Testes | xUnit (Domain e Application) | a criar | — |
| Front | React 19 + **Vite** + TypeScript strict, React Router, TanStack Query | a criar (T10) | [0013](adr/0013-api-aspnet-e-front-react-vite.md) |
| Estilo | Tailwind CSS **v4** (CSS-first) | migra do Next | [0005](adr/0005-tailwind-v4-shadcn-base-ui.md) |
| Componentes | shadcn/ui (`base-nova`) sobre **`@base-ui/react`** + lucide-react | migra do Next | [0005](adr/0005-tailwind-v4-shadcn-base-ui.md) |
| Validação (front) | Zod + React Hook Form (só experiência do usuário) | migra do Next | — |
| Datas | date-fns 4 com `ptBR` (front) · `DateOnly` (C#) | — | — |
| Gráficos | Recharts | planejado (Etapa 6) | — |
| Banco e Auth | Supabase (Postgres 17, Auth, RLS), **chamado só pela API** | ativo | [0002](adr/0002-supabase-ssr-rls.md), [0013](adr/0013-api-aspnet-e-front-react-vite.md) |
| CLI do banco | `supabase` (devDependency do `package.json` da raiz) | instalado | [0012](adr/0012-migrations-via-supabase-cli.md) |
| Deploy | Um app só (API serve o SPA) em São Paulo: Azure *Brazil South* ou Fly.io `gru` | **A DEFINIR** antes do deploy | [0013](adr/0013-api-aspnet-e-front-react-vite.md) |

## Estrutura de pastas

Alvo da Revisão 2 (detalhes por arquivo no [plano da spec 001](specs/001-autenticacao/plan.md#estrutura)).

```
api/
  Velos.slnx
  Directory.Build.props      # net10.0, Nullable, TreatWarningsAsErrors
  src/
    Velos.Domain/            # regras puras; não referencia nenhum outro projeto
    Velos.Application/       # casos de uso, interfaces (Abstractions/), validators, Result
    Velos.Infrastructure/    # Supabase (GoTrue REST), Persistence (EF Core, UserDbSession)
    Velos.Api/               # Controllers, cookies de sessão, Program.cs; serve o SPA (wwwroot)
  tests/                     # Velos.Domain.Tests, Velos.Application.Tests
web/                         # SPA Vite: pages/, features/, components/ui|shared, lib/api|utils|validations
supabase/
  migrations/                # 0001–0006 aplicadas; 0007 (role da API) planejada
  templates/                 # modelos de email (T18)
public/brand/ → web/public/brand/
docs/                        # esta documentação (SDD)
```

Dependências entre projetos **só para dentro**: `Api → Application, Infrastructure`; `Infrastructure → Application`; `Application → Domain`.

## Fluxo de dados

### Leitura

```
Página React (web/src/pages) ── useQuery ──► GET /api/<recurso>  (cookie httpOnly)
  └─ Controller ([Authorize] implícito pela FallbackPolicy)
       └─ handler da Application (filtra pelo usuário do IUserContext)
            └─ Infrastructure: UserDbSession abre transação
                 set role authenticated + request.jwt.claims  ← a RLS vale
                 └─ SELECT em tabela ou VIEW (somas no SQL)
                      └─ long (centavos) / DateOnly → JSON
  └─ formatCurrency() só na hora de exibir
```

- Somas e agregações **sempre no SQL** (views). As views já fazem cast para `bigint`.

### Escrita

```
Formulário React (RHF + zodResolver)  ── useMutation ──► POST/PUT/DELETE /api/<recurso>
  (header X-Velos-Csrf: 1)
  └─ Controller → handler da Application
       └─ FluentValidation DE NOVO (o front não é confiável)
            └─ UserDbSession → insert/update sob RLS + constraints do banco
  └─ ProblemDetails com `code` em caso de erro; o front invalida as queries afetadas
```

### Sessão

1. Login, cadastro, Google e links de email passam **pela API**, que chama o Supabase Auth (REST) com a chave publicável guardada só no servidor.
2. A API grava `velos_at` (access token) e `velos_rt` (refresh token) em cookies `httpOnly; Secure; SameSite=Lax`.
3. Em toda request, o `TokenRefreshMiddleware` renova o token perto de vencer, e o `JwtBearer` valida o access token pela **chave pública ES256** do projeto (OpenID Discovery).
4. Toda rota da API é privada por padrão (`FallbackPolicy`). No front, `RequireAuth` só melhora a experiência (redireciona para `/entrar?next=`).

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

### Auth

- Email/senha (**sem confirmação por enquanto**, Revisão 1 da spec 001) + **Google OAuth** (PKCE feito pela API).
- Assinatura dos JWT: **ES256** (chave assimétrica), validada pela API sem segredo.
- *Site URL* e *Redirect URLs*: `http://localhost:3000` / `http://localhost:3000/**`. O domínio de produção entra antes do deploy.
- Role de login da API: `velos_api` (`noinherit`, sem `bypassrls`, membro de `anon` e `authenticated`), migration `0007`.

## Dinheiro, datas e tema

| Assunto | Onde | Regra |
|---|---|---|
| Dinheiro no C# | `long` em centavos | Nunca `decimal`/`double` para guardar; sinal vem do `type` |
| Formatar valor | `web/src/lib/utils/currency.ts#formatCurrency` | `123456` → `R$ 1.234,56` |
| Valor com sinal | `formatSignedCurrency(cents, "in" \| "out")` | O sinal vem do tipo, nunca do número |
| Ler input | `parseCurrencyInput` | Usa só os dígitos, sem float |
| Data no C# | `DateOnly` ↔ `"yyyy-MM-dd"` no JSON | — |
| Data no front | `web/src/lib/utils/date.ts#parseDbDate` / `toDbDate` | `parseISO` (hora local), **nunca** `new Date("yyyy-MM-dd")` |
| Tema | `web/index.html` (script inline) + `ThemeToggle` | Classe `.dark` no `<html>`, escolha em `localStorage["theme"]` ([ADR 0009](adr/0009-tema-sem-biblioteca.md)) |

## Identidade visual (tokens)

Definidos em `web/src/styles/globals.css` (vindos do antigo `src/app/globals.css`), com o contraste medido em comentário ao lado de cada token.

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
| Host do app | API + SPA num processo só | ⬜ **A DEFINIR** antes do deploy: Azure *Brazil South* ou Fly.io `gru` |
| Google Cloud | OAuth client para login com Google | ⬜ Etapa 3 (T20) |

## Configuração e segredos

O front **não tem variáveis de ambiente com chaves**: ele só fala com a API, na mesma origem.

| Chave (API) | Onde | Observação |
|---|---|---|
| `Supabase:Url` | `appsettings.json` | `https://khvottmyspapwsdeqqnm.supabase.co` |
| `Supabase:PublishableKey` | `appsettings.json` | Chave **publicável** (`sb_publishable_…`): não é secreta, mas também não vai para o navegador |
| `App:SiteUrl` | `appsettings.Development.json` | `http://localhost:3000`; base dos links de email e do Google |
| `ConnectionStrings:Velos` | **`dotnet user-secrets`** (dev) / variável de ambiente do host (prod) | Usuário `velos_api`, pooler de sessão. **Nunca** em arquivo versionado |

A **secret key** (`sb_secret_…`) e o `service_role` **não são usados** e nunca podem aparecer em código, commit, chat ou issue.
