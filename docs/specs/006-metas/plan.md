# Plano técnico — Spec 006: Metas

> **COMO** implementar a [spec.md](spec.md). Conferido contra [ARQUITETURA.md](../../ARQUITETURA.md), [LICOES.md](../../LICOES.md) e as [ADRs](../../adr/).

- **Status:** Aprovado pelo Pedro em 2026-10-18 (revisado pela sessão 2c; ajustes incorporados)
- **Data:** 2026-10-18

## Resumo da abordagem

Mesmo padrão das specs 002 e 004: controller fino → handler na `Application` (FluentValidation) → store com `UserDbSession` (RLS) e `where user_id = {userId}` em toda query. O progresso vem da view `goal_progress`, **somado no banco** (ADR 0006). Estado, "falta" e ritmo mensal são contas sobre esses números já somados, e ficam numa função pura do `Domain` (`GoalRules`), testável com o `TimeProvider`. No front, uma feature nova `web/src/features/goals/` com a chave de cache `["goals"]`; o bloco do Início reaproveita a lista (sem mexer no endpoint do dashboard).

## Banco de dados

**Migration nova:** `supabase/migrations/0013_metas.sql` (aplicada **depois** da 0011 e da 0012).

| Mudança | Por quê |
|---|---|
| `goal_contributions.updated_at timestamptz not null default now()` + trigger `goal_contributions_set_updated_at` (`set_updated_at()`) | CA9; pendência T1 do ROADMAP; LICOES L01 |
| Check `goals_name_length`: `length(trim(name)) <= 60` | RN1: a API valida, o banco garante (padrão da 0009) |
| Recriar `goal_progress` (`security_invoker = on`) acrescentando **no fim** `contribution_count` (`count(c.id)::int`), `remaining_cents` (`greatest(target − current, 0)`) e `excess_cents` (`greatest(current − target, 0)`); join `c.goal_id = g.id and c.user_id = g.user_id` | RN4, RN7 e RN8 saem do SQL (ADR 0006); `create or replace` só aceita coluna nova no fim; o join pelo usuário é defesa em profundidade (padrão do dashboard) |
| Bloco `do $$` que para a migration se algum dado violar a check nova | Padrão da 0009/0011 |

Sem check de "aporte no futuro" nem de "prazo no passado": `current_date` roda em UTC (mesmo motivo da 0011). Essas regras ficam na `Application`, com `America/Sao_Paulo`. As policies por comando das duas tabelas já existem (0002).

## API (ASP.NET)

| Método e rota | Resposta |
|---|---|
| `GET /api/goals` | `200 [GoalSummary]`, já na ordem da RN8 |
| `GET /api/goals/{id}` | `200 { goal: GoalSummary, contributions: [{ id, amountCents, date }] }` · `404` |
| `POST /api/goals` | `201 { id }` · `400` |
| `PUT /api/goals/{id}` | `204` · `400` · `404` |
| `DELETE /api/goals/{id}` | `204` · `404` |
| `POST /api/goals/{id}/contributions` | `201 { id }` · `400` · `404` (meta não é sua) |
| `PUT /api/goals/{id}/contributions/{contributionId}` | `204` · `400` · `404` |
| `DELETE /api/goals/{id}/contributions/{contributionId}` | `204` · `404` |

`GoalSummary = { id, name, targetCents, deadline, currentCents, contributionCount, remainingCents, excessCents, status: "notStarted" | "inProgress" | "reached", monthlyPaceCents, deadlinePassed }`.

| Camada | O que entra |
|---|---|
| Domain | `Goals/GoalRules.cs`: limites (nome 60, teto = `TransactionRules.MaxAmountCents`), `IsValidDeadline(create/edit)`, `IsValidContributionDate`, `Status`, `MonthlyPace(remaining, deadline, today)` em `long`: meses = (anoPrazo − anoHoje) × 12 + (mêsPrazo − mêsHoje) + 1; ritmo = (falta + meses − 1) / meses (sem `double`). Falta e excedente vêm da view |
| Application | `Goals/` — `GoalInput` + validator, `ContributionInput` + validator, handlers (List, Get, Create, Update, Delete, AddContribution, UpdateContribution, DeleteContribution), `GoalErrors`, `GoalModels`; `IGoalStore`. A ordenação da RN8 fica no store (`order by`), o cálculo do resumo no handler |
| Infrastructure | `GoalStore`: SQL cru interpolado (padrão do `TransactionStore`), id gerado no C#; aporte só entra se a meta for do usuário (`insert ... select ... where exists (select 1 from goals where id = … and user_id = …)`); editar/excluir aporte com `where id = … and goal_id = … and user_id = …`, 0 linhas → 404. A data do aporte **sempre** vem da API (o default `current_date` da coluna é UTC) |
| Api | `GoalsController` com rotas `{id:guid}` e `{contributionId:guid}`; registro dos handlers e do store nos `DependencyInjection.cs` (edição pequena, avisada às outras sessões) |

Prazo na edição (RN2): o handler lê a meta atual; se o prazo enviado é igual ao gravado, aceita mesmo vencido.

## Front (React)

| Ação | Caminho | Responsabilidade |
|---|---|---|
| criar | `web/src/features/goals/{types,api}.ts` | Tipos e hooks: `useGoals`, `useGoal(id)`, mutações (invalidam `["goals"]`) |
| criar | `web/src/lib/validations/goals.ts` | Zod espelhando a RN1–RN3 (só experiência; quem decide é a API) |
| criar | `web/src/features/goals/GoalProgress.tsx` | Barra `aria-hidden` + `X de Y` + texto de estado (DESIGN.md → "Barras de progresso", domínio atingir) |
| criar | `web/src/features/goals/{GoalList, GoalCard, GoalForm, GoalDetail, ContributionList, ContributionDialog, DeleteGoalDialog, GoalStates}.tsx` | Telas e estados (cada um < 150 linhas) |
| criar | `web/src/features/goals/GoalsHomeBlock.tsx` | Bloco do Início (RN9) com o próprio skeleton/erro, usando a **mesma** query `["goals"]` da lista (CA4) |
| criar | `web/src/pages/{GoalsPage, GoalFormPage, GoalDetailPage}.tsx` | Rotas `/metas`, `/metas/nova`, `/metas/:id`, `/metas/:id/editar` |
| alterar | `web/src/router.tsx`, `web/src/lib/auth/routes.ts` | Rotas novas, em `lazy()` |
| alterar | `web/src/features/app-shell/AppNav.tsx` | P1: Metas no lugar de Categorias na barra do celular; no desktop, item novo |
| alterar | `web/src/pages/AccountsPage.tsx` (ou a lista) | P1: link "Gerenciar categorias" |
| alterar | `web/src/pages/PanelPage.tsx` | Encaixar o `GoalsHomeBlock` (uma linha). **Última task do front**, relendo o arquivo depois do commit da 2c (que tem alterações pendentes nele) |

Aporte não mexe em saldo (RN3), então as mutações de metas **não** chamam `invalidateMoney`.

## Dependências novas

Nenhuma.

## Riscos

- **Ordem das migrations:** a 0013 só pode ir ao banco depois da 0011 e da 0012. Até lá, os testes de integração das metas falham como os do dashboard.
- **Ritmo e fuso:** "mês atual" é de São Paulo; virada de mês às 21h UTC-3 coberta nos testes do `GoalRules`.
- **Default UTC da data do aporte:** `goal_contributions.date default current_date` roda em UTC; a API sempre envia a data.
- **IDOR no aporte:** o `goal_id` da URL tem de ser do usuário; a FK composta `(goal_id, user_id)` já impede, e o store confere antes para responder 404.
- **Arquivos compartilhados** (`AppNav`, `router`, `PanelPage`, `DependencyInjection`): edição mínima e aviso às sessões 2c e 1c.

## Como testar

- **Domain (xUnit):** prazo ao criar/editar, data do aporte, estado, falta/excedente, ritmo (CA2: R$ 6.000,00 em 9 meses → R$ 666,67; arredondamento para cima; prazo no mês atual = 1 mês; prazo vencido = sem ritmo).
- **Application:** validações (CA6), 404 para meta de outro, prazo vencido mantido na edição.
- **Integração (banco real):** progresso somado, `contribution_count`, ordem RN8, `updated_at` muda ao editar aporte (CA9), outro usuário não lê/aporta/edita/exclui (CA-seg), aporte não muda `account_balances` (CA7).
- **Front (Playwright com a API simulada):** CA1–CA8, estados, 375 e 1440 px, dois temas.
