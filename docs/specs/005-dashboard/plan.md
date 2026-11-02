# Plano técnico — Spec 005: Dashboard

> **COMO** implementar a [spec.md](spec.md). Conferido contra [ARQUITETURA.md](../../ARQUITETURA.md), [LICOES.md](../../LICOES.md) e as [ADRs](../../adr/).

- **Status:** Aprovado (decisões delegadas pelo Pedro em 2026-10-17)
- **Data:** 2026-10-17

## Resumo da abordagem

Um endpoint só de leitura, `GET /api/dashboard?month=yyyy-MM`, no padrão das specs anteriores (controller fino → handler → store com `UserDbSession`). Todos os números são somados no banco (ADR 0006): os saldos sobre a view `account_balances`, o mês sobre `monthly_summary` e os gastos por categoria numa **view nova**, `category_spending`. No front, o `PanelPage` vira o dashboard, com o mês no endereço e as barras em HTML/CSS (ADR 0018).

## Banco de dados

**Migration nova:** `supabase/migrations/0012_dashboard.sql`

| Mudança | Por quê |
|---|---|
| View `category_spending` (`security_invoker = on`): `user_id`, `month`, `category_id` (nulo = "Sem categoria"), `expense_cents` — só despesas | RN4 e RN5: a soma por categoria fica no banco, com a RLS de quem consulta |

Nenhuma tabela ou policy nova.

## API (ASP.NET)

| Método e rota | Resposta |
|---|---|
| `GET /api/dashboard?month=2026-10` | `200 { month, accountCount, creditCardCount, totalBalanceCents, creditCardDebtCents, incomeCents, expenseCents, netCents, categories: [{ categoryId, name, color, icon, amountCents }] }` · `400` com `month` inválido |

- `totalBalanceCents`: `sum(balance_cents)` das contas que não são cartão (RN1). `creditCardDebtCents`: `-sum(balance_cents)` dos cartões, positivo quando há dívida (RN2). `netCents`: `income − expense` calculado no SQL (RN3, RN5).
- `categories`: `category_spending` do mês com `left join categories` (nome, cor, ícone; nulos para "Sem categoria"), ordenado por valor desc.

| Camada | O que entra |
|---|---|
| Application | `Dashboard/GetDashboard.cs` (handler + modelos), `IDashboardStore`; reaproveita o parse de mês da spec 004 (extraído para `Common/MonthKey.cs`) |
| Infrastructure | `DashboardStore` com `UserDbSession.AsUserAsync` e `where user_id = {userId}` em toda query |
| Api | `DashboardController` |

## Front (React)

| Ação | Caminho | Responsabilidade |
|---|---|---|
| criar | `web/src/features/dashboard/{types,api}.ts` | Tipo da resposta e `useDashboard(month)` (`["dashboard", month]`) |
| criar | `web/src/features/dashboard/{BalanceCards, MonthSummary, CategorySpending, DashboardSkeleton, FirstSteps}.tsx` | Os blocos da tela |
| alterar | `web/src/pages/PanelPage.tsx` | Dashboard com `?mes=` e o `MonthSwitcher` da spec 004 |
| alterar | `web/src/features/transactions/api.ts` | Mutação de transação invalida também `["dashboard"]` (CA7) |
| alterar | `web/src/features/accounts/api.ts` | Mutação de conta invalida também `["dashboard"]` |

## Dependências novas

Nenhuma (ADR 0018: sem Recharts).

## Riscos

- **Cache:** sem invalidar `["dashboard"]`, o Início mostraria saldo velho depois de lançar (CA7).
- **Cartão com saldo positivo** não acontece pela regra da conta (RN3 da spec 002), mas um pagamento maior que a dívida pode deixar o cartão positivo: a dívida mostra zero e o crédito não entra no saldo total (o cartão fica fora, ADR 0007).

## Como testar

- **Application (xUnit):** mês inválido, mês padrão em São Paulo, repasse do erro do store.
- **Integração (banco real):** saldo total sem o cartão, dívida, mês sem transferência, gastos por categoria com "Sem categoria", outro usuário vê zero.
- **Front (Playwright, API simulada):** CA1–CA7, estados, 375 e 1440 px, dois temas.
