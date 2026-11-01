# Plano técnico — Spec 007: Fundação

> **COMO** implementar a [spec.md](spec.md) (aprovada em 2026-10-19). Escrito antes de qualquer código.
> Conferido contra [ARQUITETURA.md](../../ARQUITETURA.md), [LICOES.md](../../LICOES.md), ADRs 0006, 0007, 0012, 0013, 0015 e a [auditoria](../../audit/08-implementation-roadmap.md).
> Respostas às perguntas abertas da spec: valeram as propostas (Q1 teto R$ 1 bi · Q2 sem unicidade de nome agora · Q3 aplicar só com seu "pode aplicar" · Q4 integração pulada no CI · Q5 passos da branch protection ao final).

## Resumo da abordagem

Quatro frentes independentes, nesta ordem: (1) **migration `0009`** validada primeiro dentro de uma transação que é desfeita (`begin … rollback`), só depois aplicada; (2) **Vitest** no front; (3) **projeto de testes da API** com `WebApplicationFactory`; (4) **CI** que junta tudo. O CI vem por último para já nascer verde. Nenhuma tela, endpoint ou regra de negócio nova.

## Banco de dados

**Migration nova:** `supabase/migrations/0009_integridade_e_arquivamento.sql` (a `0008` é a última aplicada). Nenhuma tabela nova, então não há policy nova (RN9).

| Mudança | Como | Spec |
|---|---|---|
| Arquivar | `alter table accounts add column archived_at timestamptz;` idem em `categories` | CA5 |
| FI-01: conta com movimentos não se exclui | Recriar as **duas** FKs de `transactions` para `accounts` — `(account_id, user_id)` e `(transfer_account_id, user_id)` — trocando `on delete cascade` por `on delete no action` | CA1, CA2 |
| FI-02 / T11 | Recriar `(category_id, user_id)` com `on delete set null (category_id)` | CA3 |
| T1 | `goal_contributions add column updated_at timestamptz not null default now()` + `create trigger … before update … set_updated_at()` | CA6 |
| FI-04 | `alter table goal_contributions alter column date drop default;` (a coluna segue `not null`) | CA6 |
| FI-07 | `check (… <= 100000000000)` em `transactions.amount_cents`, `goal_contributions.amount_cents`, `goals.target_cents`; `abs(accounts.initial_balance_cents) <= 100000000000` | CA7 |

**Por que `no action` e não `restrict`:** o `no action` é verificado no **fim do comando**. Quando o usuário é excluído (`auth.users`), o Postgres apaga contas e transações na mesma cascata e, ao final, não sobra transação apontando para conta. O `restrict` checa na hora e poderia bloquear a exclusão do próprio usuário (RN2, CA4). Isto vira o **ADR 0017**.

**Nomes das FKs:** o Postgres gerou nomes automáticos na `0001`. Em vez de supor, a migration localiza cada FK em `pg_constraint` por tabela e colunas dentro de um bloco `do $$ … $$` e só então a recria. Se não achar, falha (não segue em silêncio).

**Ordem de execução (nada vai a produção sem passar por aqui):**
1. Escrever o SQL.
2. Rodar `begin; <0009>; <verificações de CA1–CA7>; rollback;` com acesso privilegiado (o role `velos_api` não pode alterar schema nem apagar usuários). **Isto exige o seu "pode" para eu usar o acesso ao banco**, porque toca o banco de produção (mesmo desfeito no fim). Alternativa: você roda o bloco no SQL Editor; eu só gero o texto.
3. `npx supabase db push --dry-run` → mostro a saída e o SQL.
4. **Você diz "pode aplicar"** → `npx supabase db push`.
5. Rodar de novo as verificações já com a migration aplicada (testes de integração).
6. `npm run types:db` não se aplica mais (o Next saiu); `database.types.ts` não existe no `web/`. Conferido: nada a regenerar.

**Checklist de tabela nova:** não se aplica (nenhuma). **Views:** inalteradas; conferir após o push que as 3 seguem `security_invoker` (CA8).

## Arquivos

| Ação | Caminho | Responsabilidade |
|---|---|---|
| criar | `supabase/migrations/0009_integridade_e_arquivamento.sql` | Mudanças acima |
| criar | `docs/adr/0017-exclusao-de-conta-arquivar-e-no-action.md` | Decisão D2 + `no action` |
| criar | `api/tests/Velos.Infrastructure.IntegrationTests/SchemaIntegrityTests.cs` | CT-01, 02, 03, 05, 07 (sessão do usuário de teste; tudo dentro da sessão e **desfeito** lançando uma exceção ao fim, como no teste de rollback existente) |
| criar | `api/tests/Velos.Api.Tests/Velos.Api.Tests.csproj` | Projeto novo, referencia `Velos.Api` |
| criar | `api/tests/Velos.Api.Tests/ApiFactory.cs` | `WebApplicationFactory<Program>` com configuração de teste |
| criar | `api/tests/Velos.Api.Tests/PrivateByDefaultTests.cs` | Rotas públicas = lista esperada; demais = 401 (CA11, CA12) |
| criar | `api/tests/Velos.Api.Tests/CsrfAndHeadersTests.cs` | CSRF 400, 404 JSON, cabeçalhos |
| alterar | `api/Velos.slnx` | Incluir o projeto novo |
| alterar | `api/src/Velos.Api/Program.cs` | Acrescentar `public partial class Program;` no fim (necessário para o `WebApplicationFactory`). Única alteração em código de produção |
| criar | `web/vitest.config.ts` | Config do Vitest (ambiente `node`, alias `@`, `globalSetup` com `TZ`) |
| criar | `web/src/lib/utils/currency.test.ts` | CT-15 |
| criar | `web/src/lib/utils/date.test.ts` | CT-16 |
| alterar | `web/package.json` | Script `"test": "vitest run"` e a devDependency |
| alterar | `web/tsconfig.app.json` | Incluir os tipos do Vitest (importados explicitamente, sem `globals`) |
| criar | `.github/workflows/ci.yml` | CI |
| alterar | `docs/ROADMAP.md`, `docs/CHANGELOG.md`, `docs/LICOES.md`, `docs/ARQUITETURA.md` | Ao final (CA-docs) |

## Fluxo

Não há fluxo de dados novo de produto. Fluxo de qualidade:

```
PR ──► GitHub Actions
        ├─ job api:  dotnet build → dotnet test   (integração PULADA: sem ConnectionStrings__Velos)
        └─ job web:  npm ci → typecheck → lint → test (Vitest) → check:password → build
```

## Testes da API (A0.4) — desenho

- **Configuração:** ambiente `Testing` (não `Development`, para **não** carregar o `user-secrets` com a connection string real) e valores falsos em memória: `Supabase:Url`, `Supabase:PublishableKey`, `App:PublicOrigin`, `ConnectionStrings:Velos`. Nenhum teste toca o banco nem o Supabase: as rotas exercitadas respondem antes disso (401, 400 do CSRF, 404).
- **Rotas públicas = lista esperada (CA12):** o teste lê o `EndpointDataSource` e coleta todo endpoint que tem `IAllowAnonymous`. Compara com uma **lista fixa** escrita no teste (hoje: as de `AuthController`, `AuthCallbackController`, `HealthController` e o fallback do SPA). Controller novo com `[AllowAnonymous]` faz o teste falhar até alguém atualizar a lista de propósito.
- **Privadas sem sessão (CA11):** `GET /api/me` → 401; para cada endpoint não anônimo, a resposta sem cookie é 401.
- **CSRF:** `POST`/`PUT`/`DELETE` em `/api/...` sem `X-Velos-Csrf` → 400 com `code = csrf_header_missing`; com o header, passa do middleware (a resposta pode ser 401, o que prova que passou).
- **404 JSON:** `GET /api/inexistente` → 404 (ou 401 sem sessão, conforme a ordem dos middlewares — o teste documenta o comportamento real em vez de supor), nunca `index.html`.
- **Cabeçalhos:** `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Content-Security-Policy` contendo `frame-ancestors 'none'`.
- **Armadilha do `wwwroot`:** está no `.gitignore`, então não existe no CI. O teste evita rotas do SPA (`/`), que dependem do build do Vite.

## Testes do front (A0.3) — desenho

- Vitest com `environment: "node"` (as funções são puras; **não** instalar jsdom nem Testing Library agora).
- Imports explícitos (`import { describe, it, expect } from "vitest"`): mantém o tsconfig sem tipos globais.
- **Fuso:** `globalSetup` define `process.env.TZ = "America/Sao_Paulo"` antes dos workers, para o teste de 31/10 às 23h30 reproduzir o bug do UTC-3 de verdade. Um segundo caso roda em `TZ=UTC` para provar que `toDbDate` não muda o dia.
- Casos: `parseCurrencyInput` (vazio, só símbolo, `1.234,56`, `0,99`, lixo, milhões), `formatCurrency` (0, 1, 99, 100, 123456, negativo), `formatSignedCurrency`, `toCents` (null, string, NaN, decimal), `parseDbDate` (válida, inválida lança), `toDbDate`, `formatDate`, `formatMonthLabel`, `toMonthKey`.
- **Se um teste revelar bug real** em `currency.ts`/`date.ts`, eu **não conserto às escondidas**: registro e mostro, porque a spec diz "testes", não "refatorar".

## CI (A0.1) — desenho

- `.github/workflows/ci.yml`, em `pull_request` e `push` na `main`.
- Job `api`: `ubuntu-latest`, `actions/setup-dotnet` com `10.0.x`, `dotnet build api -warnaserror` (já é `TreatWarningsAsErrors`) e `dotnet test api --no-build`.
- Job `web`: `actions/setup-node` com Node 24 e cache npm de `web/package-lock.json`; `npm ci --prefix web`, depois `typecheck`, `lint`, `test`, `check:password`, `build`.
- Sem `secrets.*` (RN8): integração pulada. Permissões mínimas (`contents: read`).
- Actions de terceiros: só as oficiais `actions/*`, fixadas por versão principal.
- **Não** instala a CLI do Supabase nem acessa o Supabase.

## Validação

- **Banco:** os CHECKs e FKs acima. A validação do lado da API (FluentValidation) dos mesmos limites entra na Etapa 4/5; aqui só o banco (RN7).
- **Mensagens ao usuário:** nenhuma nova nesta spec.

## Dependências novas (autorizadas em D5)

| Pacote | Onde | Motivo |
|---|---|---|
| `vitest` (devDependency, última estável compatível com Vite 8) | `web/` | Rodar testes no mesmo ecossistema do Vite, reaproveitando alias e config. Sem jsdom |
| `Microsoft.AspNetCore.Mvc.Testing` **10.0.12** (mesma versão dos demais pacotes `Microsoft.*`) | `Velos.Api.Tests` | Subir a API em memória para testar rotas |

A versão exata do Vitest eu confirmo no momento de instalar (`npm view vitest version` e peer deps do Vite 8) e **mostro antes de rodar o `npm install`**. Pacotes de teste já usados (xunit, `Microsoft.NET.Test.Sdk`, coverlet) reaproveitam as versões do projeto de integração.

## Decisões

- **ADR 0017** — Conta com movimentos só se arquiva; FK de conta em `no action`; teto de valor de R$ 1 bi por CHECK. (D2 + RN1/RN2/RN7.)
- Registrar na ADR 0007 uma nota "ver ADR 0017" **não** é feito (ADR aceita não se reescreve); basta o 0017 referenciá-la.

## Riscos e armadilhas

| Risco | Mitigação |
|---|---|
| `db push` altera o **único** banco | Ensaio com `begin … rollback` + `--dry-run` + seu "pode aplicar" |
| Linhas já existentes violarem os novos CHECKs | Antes, `select count(*)` de transactions/accounts/goals; se houver dados, `not valid` + validar depois |
| Nome das FKs diferir do suposto | Localizar por `pg_constraint` (acima) |
| FI-02: a FK `(category_id, type)` sem `ON DELETE` bloquear a exclusão mesmo após o `set null (category_id)` | CA3 testa exatamente isso; se falhar, a `0009` ajusta a FK |
| `WebApplicationFactory` carregar `user-secrets`/`appsettings.Development` | Ambiente `Testing` + config em memória |
| Teste de integração gravar dado no banco real | Tudo dentro da sessão com exceção final (rollback); nunca `Commit` |
| Smart App Control bloqueando DLL (L17) | Se ocorrer no `dotnet build`, tratar como problema de máquina, não do código |
| Heredoc comendo `\` (L18) | Escrever arquivos de teste com a ferramenta de escrever, não por heredoc |
| `TreatWarningsAsErrors` quebrar o projeto de testes novo | Herda `Directory.Build.props`; `.editorconfig` de `api/tests` já desliga CA1707 |

## Como testar

- **Manual:** abrir o PR de teste do CI com um erro de lint de propósito (vermelho) e depois sem (verde) → CA9.
- **Banco:** bloco `begin … rollback` (pré) + `SchemaIntegrityTests` (pós) → CA1–CA8. CA4 (excluir usuário) só pode ser provado com acesso privilegiado, no bloco `begin … rollback`.
- **Front:** `npm run test --prefix web` → CA10.
- **API:** `dotnet test api` → CA11, CA12.
- **Tudo:** `dotnet build api && dotnet test api` e `typecheck`, `lint`, `build` do web → CA-build.
- **RLS:** nenhuma policy mudou; o teste de isolamento já existente (`UserDbSessionTests`) continua passando (CA-seg).
