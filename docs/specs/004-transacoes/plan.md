# Plano técnico — Spec 004: Transações

> **COMO** implementar a [spec.md](spec.md). Escrito depois de a spec ser aprovada e antes de qualquer código.
> Conferido contra [ARQUITETURA.md](../../ARQUITETURA.md), [LICOES.md](../../LICOES.md) e as [ADRs](../../adr/).

- **Status:** Rascunho (aguardando aprovação)
- **Data:** 2026-10-17

## Resumo da abordagem

Um CRUD no padrão das specs 001 e 002: **controller fino → handler da Application (FluentValidation) → store com `UserDbSession`** (RLS e `where user_id` em toda query) → `ProblemDetails` com `code`. O banco já tem quase tudo: a tabela `transactions` (forma da transferência, categoria do mesmo tipo, contas do próprio usuário por FK composta), o saldo em `account_balances` e os totais em `monthly_summary` ([ADR 0006](../../adr/0006-agregacao-no-sql-views.md), [ADR 0007](../../adr/0007-transferencia-registro-unico-e-cartao.md)). No front, a lista do mês com o mês e o filtro **no endereço**, e um formulário pensado para os 3 toques.

## Banco de dados

**Migration nova:** `supabase/migrations/0011_transacoes.sql` (pequena).

| Mudança | Por quê |
|---|---|
| `check (description is null or length(description) <= 100)` em `transactions` | RN5: o banco também garante |
| Confere antes se algum dado existente viola e falha com mensagem clara (hoje: só dados de teste) | Padrão da `0009` |

- **Sem check de "data no futuro" no banco:** `current_date` não é imutável e roda em UTC (em UTC-3, à noite, "hoje" já seria amanhã). A regra fica na Application, com o fuso **America/Sao_Paulo** (`TimeProvider`).
- Nenhuma tabela, view ou policy nova: `transactions` já tem RLS por comando; `account_balances` e `monthly_summary` já têm `security_invoker`.
- Fluxo: `npx supabase db push --dry-run` → **aprovação do Pedro** → `npx supabase db push`.

## API (ASP.NET)

### Endpoints (todos privados pela `FallbackPolicy`; mutações com `X-Velos-Csrf`)

| Método e rota | Resposta | Observação |
|---|---|---|
| `GET /api/transactions?month=2026-10&categoryId=…` | `200 { month, incomeCents, expenseCents, items: [...] }` | `month` padrão: mês atual (São Paulo). Totais de `monthly_summary` (o mês todo, sem o filtro). Cada item: `{ id, type, amountCents, date, description, account: {id, name}, transferAccount?: {id, name}, category?: {id, name, color, icon} }`, ordenados por data desc e criação desc |
| `GET /api/transactions/{id}` | `200` · `404 not_found` | Para editar: `{ id, type, amountCents, date, description, accountId, transferAccountId, categoryId }` |
| `POST /api/transactions` | `201 { id }` · `400 validation_failed` | `{ type, amountCents, date, description?, accountId, transferAccountId?, categoryId? }` |
| `PUT /api/transactions/{id}` | `204` · `400` · `404` | Mesmo corpo. Tipo só troca entre despesa e receita (RN8) |
| `DELETE /api/transactions/{id}` | `204` · `404` | |

`id` inválido responde 404; `month` inválido responde 400 com erro no campo.

### Camadas

| Camada | O que entra |
|---|---|
| **Domain** | `TransactionType` (`Expense`, `Income`, `Transfer`); `TransactionRules`: valor 1..R$ 999.999.999,99 (reaproveita o teto de `AccountRules`), descrição até 100, data ≤ hoje, forma da transferência (destino ≠ origem, sem categoria) e troca de tipo permitida (RN8) |
| **Application** | `Transactions/`: `ListTransactions` (mês + filtro), `GetTransaction`, `CreateTransaction`, `UpdateTransaction`, `DeleteTransaction`; `TransactionInputValidator` com as mensagens da tela; `ITransactionStore` em `Abstractions/`. **RN10:** antes de gravar, o handler pede ao store as referências (conta, destino, categoria e o tipo dela) **filtradas pelo usuário**; inexistente ou de outra pessoa vira erro no campo ("Conta não encontrada", "Escolha uma categoria de despesa"), igual a inexistente. As FKs compostas do banco seguem como segunda barreira |
| **Infrastructure** | `TransactionStore` com `UserDbSession.AsUserAsync` e SQL interpolado (parametrizado), `where user_id = {userId}` em toda query. A lista faz um `select` com `left join` em `categories` e `accounts` (nomes) e lê os totais de `monthly_summary` na mesma transação |
| **Api** | `TransactionsController` fino; enum em camelCase (`ApiEnums`); `month` no formato `yyyy-MM` |

## Front (React)

| Ação | Caminho | Responsabilidade |
|---|---|---|
| criar | `web/src/features/transactions/types.ts` | Tipos, rótulos, ícones e o sinal por tipo |
| criar | `web/src/features/transactions/api.ts` | Hooks React Query: `["transactions", month, categoryId]`, `["transactions", id]`. Toda mutação invalida `transactions` **e** `accounts` (o saldo muda) |
| criar | `web/src/features/transactions/{TransactionList, TransactionRow, MonthSwitcher, CategoryFilter}.tsx` | Lista do mês agrupada por dia ("Hoje", "Ontem", "sexta, 10 de outubro" com date-fns `ptBR`), totais com sinal e ícone, filtro por categoria |
| criar | `web/src/features/transactions/{TransactionForm, TransactionTypeTabs, CategoryGrid, AccountSelect}.tsx` | Formulário: abas Despesa/Receita/Transferência, `MoneyInput` com foco ao abrir, grade de categorias do tipo (`CategoryBadge`), conta num `<select>` nativo de 44 px, data `<input type="date" max=hoje>`, descrição |
| criar | `web/src/features/transactions/DeleteTransactionDialog.tsx` | Confirmação curta (RN9) |
| criar | `web/src/lib/utils/last-used.ts` | Última conta e última categoria por tipo no `localStorage` (conveniência do aparelho, nada sensível; `try/catch`) |
| criar | `web/src/lib/validations/transactions.ts` | Zod com as mesmas mensagens do validador C# |
| criar | `web/src/pages/{TransactionsPage, TransactionFormPage}.tsx` | `/transacoes`, `/transacoes/nova`, `/transacoes/:id` em `lazy()` |
| alterar | `web/src/features/app-shell/AppNav.tsx` | P4: "Transações" como 2º item; botão "Nova transação" no centro da barra (celular) e no topo do menu lateral (desktop) |
| alterar | `web/src/pages/PanelPage.tsx` | P5: "Nova transação" no topo do Início |
| alterar | `web/src/lib/utils/date.ts` | `todayInSaoPaulo()` e helpers de mês (`yyyy-MM`), sem `new Date("yyyy-MM-dd")` |
| alterar | `web/src/router.tsx`, `lib/auth/routes.ts` | Rotas novas |

## Fluxo de dados

```
Leitura:  TransactionsPage (?mes=2026-10&categoria=…)
            └─ useTransactions(month, categoryId) ─► GET /api/transactions
                 └─ ListTransactionsHandler (IUserContext) ─► TransactionStore
                      └─ UserDbSession: select … from transactions t left join categories/accounts
                         where t.user_id = {userId} and t.date >= {início} and t.date < {fim} [and t.category_id = {cat}]
                         + select … from monthly_summary where user_id = {userId} and month = {início}

Escrita:  TransactionForm (RHF + Zod; MoneyInput → centavos; data ≤ hoje)
            ─ useMutation ─► POST/PUT /api/transactions (X-Velos-Csrf)
            └─ handler: FluentValidation → referências do usuário (store) → insert/update (user_id do JWT)
            └─ onSuccess: invalidate ["transactions"] e ["accounts"] → volta para /transacoes?mes=<mês da data>
```

## Validação

| Regra | Front (Zod, só UX) | API (decide) | Banco (garante) |
|---|---|---|---|
| Valor > 0 e ≤ R$ 999.999.999,99 (RN2) | ✅ | ✅ | `> 0` (check) |
| Data obrigatória e ≤ hoje em São Paulo (RN4) | ✅ (`max`) | ✅ | — |
| Descrição ≤ 100 (RN5) | ✅ | ✅ | ✅ (0011) |
| Categoria obrigatória e do tipo (RN1, RN6) | ✅ | ✅ (referência do usuário) | ✅ FK `(category_id, type)` |
| Transferência: destino ≠ origem, sem categoria (RN1) | ✅ | ✅ | ✅ check `transfer_shape` |
| Conta/categoria do próprio usuário (RN10) | — | ✅ | ✅ FKs compostas + RLS |
| Troca de tipo só despesa ↔ receita (RN8) | ✅ (abas travadas) | ✅ | — |

## Dependências novas

Nenhuma.

## Decisões

Nenhuma decisão de arquitetura nova: o modelo de transferência (ADR 0007), a soma no SQL (ADR 0006) e o dinheiro em centavos (ADR 0004) já cobrem a etapa. As respostas P1–P5 estão na spec.

## Riscos e armadilhas

- **Fuso:** "hoje" e "mês atual" sempre em São Paulo, na API (`TimeProvider` + `America/Sao_Paulo`) e no front (`Intl` com `timeZone`). Nunca `new Date("yyyy-MM-dd")` (LICOES/CLAUDE.md).
- **Saldo muda em outras telas:** toda mutação invalida também `["accounts"]` (L29: excluir com `removeQueries` no item).
- **Transferência para o cartão** diminui a dívida pela view, sem código especial: conferir no teste (CA5).
- **Lista grande:** o mês é a página. Sem paginação no MVP; o índice `(user_id, date desc)` já existe.
- **Não testar pelo login real em massa:** testes de tela com a API simulada (padrão da T11); o banco real no teste de integração e na T14.

## Como testar

- **Domain/Application (xUnit):** regras de valor, data (com `FakeTimeProvider` perto da meia-noite em São Paulo), descrição, forma da transferência, troca de tipo, referências de outro usuário.
- **Integração (banco real, rodado pelo Pedro):** inserir, listar o mês, totais, saldo após despesa/receita/transferência (inclusive para o cartão), excluir, e outro usuário sem acesso.
- **Front (Playwright, API simulada):** CA1 (contar os toques), CA6–CA10, CA12, estados, 375 e 1440 px, dois temas.
- `dotnet build api && dotnet test api`, `npm run typecheck && npm run lint && npm run build --prefix web`.
