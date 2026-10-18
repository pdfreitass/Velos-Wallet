# Tasks — Spec 005: Dashboard

> Passos pequenos e verificáveis, a partir do [plan.md](plan.md). Só marcar `[x]` depois de verificar.

- [ ] **T1** — Migration `0012_dashboard.sql` (view `category_spending`)
  - Verificação: `npx supabase db push --dry-run`; aplicar com a aprovação do Pedro
- [ ] **T2** — API: `MonthKey`, `GetDashboardHandler`, `IDashboardStore`, `DashboardStore`, `DashboardController`
  - Verificação: testes da Application; teste de integração; `dotnet build` sem aviso
- [ ] **T3** — Front: `useDashboard`, blocos da tela, `PanelPage` com `?mes=`, invalidação do `["dashboard"]`
  - Verificação: CA1–CA7 no Playwright com a API simulada; 375 e 1440 px; dois temas
- [ ] **T4** — Revisões `security` e `qa`; build, testes, typecheck, lint e build do `web`
- [ ] **T5** — ROADMAP, CHANGELOG, LICOES, ARQUITETURA

## Registro

| Task | Commit | Observação |
|---|---|---|
| T0 | | Spec e plano aprovados por delegação do Pedro em 2026-10-17 |
