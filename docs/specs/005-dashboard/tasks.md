# Tasks — Spec 005: Dashboard

> Passos pequenos e verificáveis, a partir do [plan.md](plan.md). Só marcar `[x]` depois de verificar.

- [x] **T1** — Migration `0012_dashboard.sql` (view `category_spending`)
  - Verificação: `npx supabase db push --dry-run`; aplicar com a aprovação do Pedro
- [x] **T2** — API: `MonthKey`, `GetDashboardHandler`, `IDashboardStore`, `DashboardStore`, `DashboardController`
  - Verificação: testes da Application; teste de integração; `dotnet build` sem aviso
- [x] **T3** — Front: `useDashboard`, blocos da tela, `PanelPage` com `?mes=`, invalidação do `["dashboard"]`
  - Verificação: CA1–CA7 no Playwright com a API simulada; 375 e 1440 px; dois temas
- [x] **T4** — Revisões `security` e `qa`; build, testes, typecheck, lint e build do `web`
- [x] **T5** — ROADMAP, CHANGELOG, LICOES, ARQUITETURA

## Registro

| Task | Commit | Observação |
|---|---|---|
| T0 | | Spec e plano aprovados por delegação do Pedro em 2026-10-17 |
| T1 | 9704aae | `0012` aplicada pelo Pedro em 2026-10-18 |
| T2 | ac31d53 | |
| T3 | 6709f76 | CA no navegador com login real ainda a fazer |
| T4 | 5029685, b85cbc1 | `security` aprovada (2 baixos: teste soma = despesas; rate limit no dashboard); `qa` com 3 correções; testes de integração em sequência; 117 + 148 + 24 testes |
| T5 | (este commit) | ROADMAP, CHANGELOG, LICOES (L31, L32) e ARQUITETURA |
