# Tasks — Spec 006: Metas

> Passos pequenos e verificáveis, a partir do [plan.md](plan.md). Só marcar `[x]` depois de verificar.
> Fluxo multi-sessão: cada task passa pela revisão da sessão **velos-wallet-2c** antes do commit.

- [x] **T1** — Migration `0013_metas.sql` (`updated_at` + trigger em `goal_contributions`, check do nome, `goal_progress` com contagem, falta e excedente)
  - Verificação: SQL revisado pela 2c; `npx supabase db push --dry-run` lista a 0013; aplicar só com a aprovação do Pedro (depois da 0011 e da 0012)
- [x] **T2** — Domain: `GoalRules` (limites, prazo ao criar/editar, data do aporte, estado, ritmo mensal)
  - Verificação: testes do Domain (CA2 = R$ 666,67; prazo no mês atual = 1 mês; virada às 21h UTC-3; prazo vencido sem ritmo)
- [x] **T3** — Application: inputs + validators, handlers de meta e de aporte, `GoalErrors`, `GoalModels`, `IGoalStore`
  - Verificação: testes da Application (CA6, 404 para meta de outro, prazo vencido mantido na edição)
- [ ] **T4** — Infrastructure + Api: `GoalStore`, `GoalsController`, registro na DI
  - Verificação: testes de integração (soma, contagem, ordem RN8, `updated_at` do aporte, IDOR, aporte não muda saldo); `dotnet build` sem aviso
- [ ] **T5** — Front: tipos, hooks (`["goals"]`), Zod, `GoalProgress`, lista `/metas`, formulário de meta
  - Verificação: CA1, CA6 no Playwright com a API simulada; estados; 375 e 1440 px; dois temas
- [ ] **T6** — Front: detalhe `/metas/:id`, aportes (diálogo, editar, excluir), excluir meta
  - Verificação: CA2–CA5 no Playwright
- [ ] **T7** — Front: navegação (P1: Metas no lugar de Categorias no celular, link "Gerenciar categorias" em Contas) e `GoalsHomeBlock` no `PanelPage` (relendo depois do commit da 2c)
  - Verificação: CA8; navegação nos dois tamanhos
- [ ] **T8** — Revisões `security` e `qa`; build, testes, typecheck, lint e build do `web`
- [ ] **T9** — Resumo para a 2c atualizar ROADMAP, CHANGELOG, LICOES e ARQUITETURA

## Registro

| Task | Commit | Observação |
|---|---|---|
| T0 | | Spec e plano aprovados pelo Pedro em 2026-10-18 (plano revisado pela 2c) |
| T1 | c504e5e | SQL aprovado pela 2c; dry-run lista só a 0013; aplicar no banco é com o Pedro |
| T2 | bd26057 | Aprovado pela 2c; Domain 138/138 |
| T3 | (este) | Aprovado pela f2; Application 171/171 |
