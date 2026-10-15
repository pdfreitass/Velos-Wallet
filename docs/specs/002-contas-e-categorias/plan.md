# Plano técnico — Spec 002: Contas e categorias

> **COMO** implementar a [spec.md](spec.md). Escrito depois de a spec ser aprovada e antes de qualquer código.
> Conferido contra [ARQUITETURA.md](../../ARQUITETURA.md), [LICOES.md](../../LICOES.md) e as [ADRs](../../adr/).

- **Status:** Aprovado (2026-10-15)
- **Data:** 2026-10-15

## Resumo da abordagem

Dois CRUDs no padrão que a Etapa 3 deixou pronto: **controller fino → handler da Application (FluentValidation) → Infrastructure com `UserDbSession`** (RLS do usuário em toda query) → `ProblemDetails` com `code`. No front, uma página por lista e uma por formulário, com React Query, React Hook Form + Zod e os estados loading/vazio/erro. Uma migration (`0009`) ajusta o banco: cheque especial (P1), exclusão de categoria com transações (T11) e nomes únicos sem diferenciar maiúsculas (RN9).

## Banco de dados

**Migration nova:** `supabase/migrations/0009_contas_e_categorias.sql`.

| Mudança | Por quê |
|---|---|
| `accounts_initial_balance_sign` passa a aceitar negativo em `checking` além de `credit_card` | P1 / RN3: cheque especial |
| Nova check: `credit_card` com saldo inicial **≤ 0** | RN3: no cartão, o valor digitado é sempre dívida |
| `check (length(trim(name)) <= 40)` em `accounts` e `<= 30` em `categories` | RN2 / RN9: o banco também garante, não só o app |
| Índice único `(user_id, lower(name), type)` em `categories` | RN9: "Lazer" e "lazer" são a mesma. O único atual diferencia maiúsculas |
| FK `(category_id, user_id) … on delete set null` → **`on delete set null (category_id)`** (Postgres 15+; o projeto é 17) | **T11**: hoje o `set null` tentaria anular também o `user_id` (`not null`), e apagar categoria com transações falha (RN11) |

- Antes de criar o índice único e as checks de tamanho, a migration **confere** se algum dado existente as violaria e falha com mensagem clara (hoje só há as categorias padrão).
- Nenhuma tabela, view ou policy nova: `accounts`, `categories` e a view `account_balances` já têm RLS por comando e `security_invoker`.
- Fluxo: `npx supabase db push --dry-run` → **aprovação do Pedro** → `npx supabase db push`.

## API (ASP.NET)

### Endpoints (todos privados pela `FallbackPolicy`; mutações com `X-Velos-Csrf`)

| Método e rota | Resposta | Observação |
|---|---|---|
| `GET /api/accounts` | `200 [{ id, name, type, initialBalanceCents, balanceCents }]` | Lê de `account_balances` (soma no SQL) |
| `GET /api/accounts/{id}` | `200` · `404 not_found` | Outra pessoa ou inexistente: o mesmo 404 (CA11) |
| `POST /api/accounts` | `201 { id }` · `400 validation_failed` | `{ name, type, initialBalanceCents }`, **com sinal** (o front converte "devo R$ 640,90" em `-64090`) |
| `PUT /api/accounts/{id}` | `204` · `400` · `404` | `{ name, initialBalanceCents }`. O tipo não entra no contrato (RN1) |
| `GET /api/accounts/{id}/deletion-impact` | `200 { incomeCount, expenseCount, transferCount, affectedAccounts: [{ id, name }] }` | Para o diálogo da RN6 |
| `DELETE /api/accounts/{id}` | `204` · `404` | O banco apaga as movimentações em cascata |
| `GET /api/categories` | `200 [{ id, name, type, color, icon }]` | Ordenadas por tipo e nome (`pt-BR`) |
| `GET /api/categories/{id}` | `200` · `404` | |
| `POST /api/categories` | `201 { id }` · `400` · `409 category_name_taken` | `{ name, type, color, icon }` |
| `PUT /api/categories/{id}` | `204` · `400` · `404` · `409` | `{ name, color, icon }` (RN8: tipo fixo) |
| `GET /api/categories/{id}/deletion-impact` | `200 { transactionCount }` | Para o diálogo da RN11 |
| `DELETE /api/categories/{id}` | `204` · `404` | |

`id` inválido (não-GUID) responde 404, igual a inexistente.

### Camadas

| Camada | O quê |
|---|---|
| **Domain** | `AccountType`; `AccountRules` (nome 1–40; sinal do saldo inicial por tipo, RN3; teto R$ 999.999.999,99); `CategoryRules` (nome 1–30); `CategoryCatalog` (paleta de cores e lista de ícones permitidos, RN10) |
| **Application** | `Accounts/` e `Categories/`: um arquivo por caso de uso (`List`, `Get`, `Create`, `Update`, `GetDeletionImpact`, `Delete`), validadores FluentValidation com as mensagens da tela, interfaces `IAccountStore` e `ICategoryStore` em `Abstractions/`. Todo handler usa o `IUserContext`: o usuário vem do JWT, **nunca do corpo** |
| **Infrastructure** | `AccountStore` e `CategoryStore` com `UserDbSession.AsUserAsync` e SQL parametrizado (`SqlQuery`/`ExecuteSql` com interpolação, como na Etapa 3). Toda query filtra `user_id = {userId}` **além** da RLS. Violação de único (`23505`) do índice da RN9 vira `category_name_taken`; check e FK viram `validation_failed`, sem repassar a mensagem do Postgres |
| **Api** | `AccountsController` e `CategoriesController`, finos (só traduzem `Result` em HTTP) |

## Front (React)

| Ação | Caminho | Responsabilidade |
|---|---|---|
| criar | `web/src/components/ui/{alert-dialog,checkbox,radio-group,skeleton}.tsx` | shadcn sobre `@base-ui/react` (já instalado) |
| criar | `web/src/components/shared/MoneyInput.tsx` | Digita centavos da direita para a esquerda ("R$ 0,00" → "R$ 0,01"…); só dígitos; usa `formatCurrencyInput`/`parseCurrencyInput`; `inputMode="numeric"`; 44 px |
| criar | `web/src/components/shared/CategoryBadge.tsx` | Ícone na cor da categoria sobre fundo suave + nome na cor do texto (o nome nunca usa a cor da categoria, RN10) |
| criar | `web/src/features/categories/catalog.ts` | Paleta e ícones (espelho do `CategoryCatalog` do C#) e o mapa nome → componente do lucide |
| criar | `web/src/features/app-shell/AppLayout.tsx`, `AppNav.tsx` | Cabeçalho (marca, tema, Sair), barra inferior no celular e menu lateral a partir de `lg`; `aria-current="page"` + indicador além da cor |
| criar | `web/src/features/accounts/{api.ts, AccountList.tsx, AccountForm.tsx, DeleteAccountDialog.tsx}` | Hooks React Query (`["accounts"]`), lista com seções, formulário com o texto da RN3 por tipo, diálogo da RN6 |
| criar | `web/src/features/categories/{api.ts, CategoryList.tsx, CategoryForm.tsx, DeleteCategoryDialog.tsx}` | Idem para categorias, com grade de cores e de ícones (botões com `aria-pressed` e nome acessível) |
| criar | `web/src/pages/{AccountsPage,AccountFormPage,CategoriesPage,CategoryFormPage}.tsx` | Rotas `/contas`, `/contas/nova`, `/contas/:id`, `/categorias`, `/categorias/nova`, `/categorias/:id`, em `lazy()` |
| criar | `web/src/lib/validations/{accounts,categories}.ts` | Zod com as mesmas mensagens dos validadores C# |
| alterar | `web/src/router.tsx` | Rotas novas dentro de `RequireAuth` + `AppLayout` |
| alterar | `web/src/pages/PanelPage.tsx` | Passa a usar o `AppLayout`; "Olá" + atalhos para Contas e Categorias (P4) |
| alterar | `web/src/components/ui/button.tsx` | **T8**: tamanhos padrão com 44 px de alvo |
| alterar | `web/src/features/auth/errors.ts` → mover para `web/src/lib/api/errors.ts` | As mensagens de erro passam a servir a todas as features (`category_name_taken`, `not_found`) |
| alterar | `web/src/styles/globals.css` | Tokens da paleta das categorias, em par claro/escuro, com contraste medido em comentário |

**Paleta das categorias (RN10):** as 10 cores das categorias padrão + 2 novas. O banco guarda o hex "canônico" (o que já está lá); o front mostra o tom de cada tema. Exigência: **ícone ≥ 3:1** contra o fundo do card (WCAG 1.4.11, componente gráfico), medido nos dois temas. O nome usa a cor do texto, já medida (≥ 4,5:1). As cores do seed que não passam em algum tema ganham o tom ajustado só na exibição. Nenhuma migration de dados.

## Fluxo de dados

```
Leitura:  AccountsPage ─ useQuery(["accounts"]) ─► GET /api/accounts
            └─ ListAccountsHandler (IUserContext) ─► AccountStore
                 └─ UserDbSession.AsUserAsync: select … from account_balances where user_id = {userId}
                    (RLS + security_invoker valem; soma no SQL)

Escrita:  AccountForm (RHF + Zod; MoneyInput → centavos; sinal pela RN3)
            ─ useMutation ─► POST /api/accounts (X-Velos-Csrf)
            └─ CreateAccountHandler ─ FluentValidation (de novo) ─► AccountStore.insert (user_id do JWT)
            └─ onSuccess: invalidate ["accounts"] → navega para /contas
```

## Validação

| Regra | Front (Zod, só UX) | API (FluentValidation, decide) | Banco (garante) |
|---|---|---|---|
| Nome de conta 1–40 / de categoria 1–30 | ✅ | ✅ | ✅ check (0009) |
| Sinal do saldo inicial por tipo (RN3) | ✅ (pela opção) | ✅ | ✅ check (0009) |
| Teto de R$ 999.999.999,99 | ✅ (`MoneyInput`) | ✅ | — (`bigint`) |
| Tipo de conta/categoria válido | ✅ | ✅ | ✅ enum |
| Cor e ícone do catálogo (RN10) | ✅ | ✅ | formato (`#RRGGBB`) |
| Nome de categoria único por tipo, sem maiúsculas (RN9) | — | via banco (`409`) | ✅ índice (0009) |
| Dono do registro (RN12) | — | ✅ `where user_id` | ✅ RLS + FKs compostas |

## Dependências novas

**Nenhuma.** Os componentes de diálogo, checkbox, rádio e skeleton são arquivos do shadcn copiados para `web/src/components/ui/`, sobre o `@base-ui/react` que já é dependência. Se o `shadcn add` tentar instalar algum pacote, paro e explico antes.

## Decisões

- **ADR 0017 — Excluir conta apaga as movimentações (sem arquivar):** registra a P2, o aviso detalhado e o efeito nas transferências com outras contas. A paleta fixa e o tipo imutável estão na spec e não mudam arquitetura, então não ganham ADR.

## Riscos e armadilhas

- **Dinheiro:** `initialBalanceCents` é `long` com sinal; o `MoneyInput` trabalha em centavos inteiros do começo ao fim (nunca `parseFloat`). Teste: 0,10, 0,01 e 999.999.999,99 voltam iguais.
- **Excluir conta muda o saldo de outras contas** (as transferências somem dos dois lados). O `deletion-impact` precisa contar os dois lados (`account_id` **e** `transfer_account_id`).
- **FK com `set null (coluna)`** é sintaxe do Postgres 15+. Conferir no `dry-run` e testar a exclusão com uma transação criada por SQL (CA10).
- **Índice único com `lower()`** pode falhar se já existirem duplicadas; a migration confere antes.
- **IDOR:** todo `{id}` vem da URL. Toda query filtra por `user_id` além da RLS, e um id alheio responde o mesmo 404 de um inexistente.
- **Limite por IP (Etapa 3)** vale só para `/api/auth/*`; os CRUDs não entram nele.
- **Barra inferior fixa** cobre o fim da lista sem `padding-bottom` + `env(safe-area-inset-bottom)` (CA12).
- **L26:** todo `code` novo (`category_name_taken`, `not_found`) entra no mapa de mensagens do front.

## Como testar

- **Unitários (xUnit):** `AccountRules` (sinal por tipo, limites), `CategoryRules`, `CategoryCatalog`; handlers com dublês (usuário sempre do `IUserContext`, 404 para alheio, `409` mapeado).
- **Integração (banco real, conta de teste com `Tests:UserId`):** criar, ler, editar e excluir conta e categoria; outro `user_id` não é lido nem alterado (RLS); excluir categoria com transação deixa a transação com `category_id` nulo (T11 / CA10); excluir conta com transferência some dos dois lados; cada teste limpa o que criou.
- **Manual (Playwright, 375 e 1440 px, claro e escuro):** CA1–CA12, com estados vazio, skeleton e erro (API parada).
- **Agentes:** `security` (CA-seg, IDOR em toda rota com `{id}`) e `qa` (CA-a11y, CA-build).
- `dotnet build api && dotnet test api` · `npm run typecheck && npm run lint && npm run build` (prefixo `web`).
