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
| T3 | 6709f76 | |
| T4 | 5029685, b85cbc1 | `security` aprovada (2 baixos: teste soma = despesas; rate limit no dashboard); `qa` com 3 correções; testes de integração em sequência; 117 + 148 + 24 testes |
| T5 | (este commit) | ROADMAP, CHANGELOG, LICOES (L31, L32) e ARQUITETURA |
| T6 | (este) | **CA1–CA7 conferidos no navegador com login real em 2026-11-01**, numa conta de teste no localhost: CA1 Nubank R$ 2.500 + Reserva R$ 10.000 + Cartão R$ 640,90 → saldo R$ 12.500,00 e dívida em blocos separados; CA2 cheque especial baixou o total para R$ 7.500,00 e, levado a -R$ 10.500, para -R$ 500,00 com o sinal "−"; CA3 R$ 3.000,00 de receita e R$ 255,80 de despesa → +R$ 3.000,00 / -R$ 255,80 / +R$ 2.744,20, e a transferência de R$ 1.000,00 não entrou em nenhum; CA4 Transporte R$ 420,00 (44%) > Alimentação R$ 255,80 (27%) > Lazer R$ 180,50 (19%) > Sem categoria R$ 95,00 (10%), só despesas; CA5 ‹ levou a `?mes=2026-10` com o mês e os gastos zerados e o saldo e a dívida intactos; CA6 primeiros passos visto antes de cadastrar as contas; CA7 despesa de R$ 60,00 lançada pela interface → saldo R$ 14.488,70, despesas R$ 1.011,30, resultado R$ 1.988,70 e Alimentação em R$ 315,80. CA-a11y em 375 px nos dois temas. Falta só a PR (T7) |
