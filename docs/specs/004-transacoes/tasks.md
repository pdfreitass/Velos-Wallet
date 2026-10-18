# Tasks — Spec 004: Transações

> Passos pequenos e verificáveis, a partir do [plan.md](plan.md). Uma task por vez; ao terminar, parar e mostrar.
> Só marcar `[x]` depois de verificar (build, testes ou tela).

## Banco
- [ ] **T1** — Migration `0011_transacoes.sql` (descrição ≤ 100, com a conferência dos dados existentes)
  - Verificação: `npx supabase db push --dry-run`; aplicar só com a aprovação do Pedro

## API
- [ ] **T2** — Domain: `TransactionType` e `TransactionRules` (valor, descrição, data ≤ hoje em São Paulo, forma da transferência, troca de tipo)
  - Verificação: testes em `Velos.Domain.Tests`
- [ ] **T3** — Application: casos de uso (`List`, `Get`, `Create`, `Update`, `Delete`), `TransactionInputValidator`, `ITransactionStore` e a checagem das referências do usuário (RN10)
  - Verificação: testes em `Velos.Application.Tests` (inclusive conta/categoria de outro usuário e o relógio perto da meia-noite)
- [ ] **T4** — Infrastructure: `TransactionStore` (lista do mês com nomes, totais de `monthly_summary`, referências, insert/update/delete) com `UserDbSession`
  - Verificação: testes de integração (rodados pelo Pedro, no banco real)
- [ ] **T5** — Api: `TransactionsController` (`month` em `yyyy-MM`, enums em camelCase)
  - Verificação: curl sem sessão (401) e sem CSRF (400); `dotnet build` sem aviso

## Front
- [ ] **T6** — Base: tipos, `api.ts` (invalida `transactions` e `accounts`), Zod, helpers de data (`todayInSaoPaulo`, mês `yyyy-MM`), `last-used.ts`
  - Verificação: typecheck e lint; regras de data testadas com `node`
- [ ] **T7** — Navegação (P4) e Início (P5): "Transações" na barra e no menu lateral, botão "Nova transação" no centro da barra e no topo do menu
  - Verificação: 375 e 1440 px, dois temas; alvos ≥ 44 px; item atual marcado além da cor
- [ ] **T8** — Lista do mês: `MonthSwitcher`, totais, `CategoryFilter`, agrupamento por dia, estados (skeleton, vazio, erro)
  - Verificação: CA7, CA8; mês e filtro no endereço
- [ ] **T9** — Formulário: abas de tipo, `MoneyInput` com foco, `CategoryGrid`, conta, data ≤ hoje, descrição, transferência (De/Para); edição com a troca despesa ↔ receita (P3); exclusão (RN9)
  - Verificação: CA1 (3 toques), CA3–CA6, CA9, CA10, CA12; erros da API no campo

## Fechamento
- [ ] **T10** — Critérios de aceite em 375 e 1440 px, temas claro e escuro (CA1–CA12), com login real
- [ ] **T11** — Agentes `security` (CA-seg, IDOR) e `qa` (CA-a11y, CA-build)
- [ ] **T12** — `dotnet build api`, `dotnet test api`, `typecheck`, `lint` e `build` do `web`
- [x] **T13** — Atualizar ROADMAP, CHANGELOG, LICOES e ARQUITETURA
- [ ] **T14** — PR para `main` com descrição e checklist de testes

## Registro

| Task | Commit | Observação |
|---|---|---|
| T0 | | Spec aprovada pelo Pedro em 2026-10-17 (P1–P5 conforme a recomendação); plano e mockup aguardando |
