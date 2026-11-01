# Tasks — Spec 006: Metas

> Passos pequenos e verificáveis, a partir do [plan.md](plan.md). Só marcar `[x]` depois de verificar.
> Fluxo multi-sessão: cada task passa pela revisão da sessão **velos-wallet-2c** antes do commit.

- [x] **T1** — Migration `0013_metas.sql` (`updated_at` + trigger em `goal_contributions`, check do nome, `goal_progress` com contagem, falta e excedente)
  - Verificação: SQL revisado pela 2c; `npx supabase db push --dry-run` lista a 0013; aplicar só com a aprovação do Pedro (depois da 0011 e da 0012)
- [x] **T2** — Domain: `GoalRules` (limites, prazo ao criar/editar, data do aporte, estado, ritmo mensal)
  - Verificação: testes do Domain (CA2 = R$ 666,67; prazo no mês atual = 1 mês; virada às 21h UTC-3; prazo vencido sem ritmo)
- [x] **T3** — Application: inputs + validators, handlers de meta e de aporte, `GoalErrors`, `GoalModels`, `IGoalStore`
  - Verificação: testes da Application (CA6, 404 para meta de outro, prazo vencido mantido na edição)
- [x] **T4** — Infrastructure + Api: `GoalStore`, `GoalsController`, registro na DI
  - Verificação: testes de integração (soma, contagem, ordem RN8, `updated_at` do aporte, IDOR, aporte não muda saldo); `dotnet build` sem aviso
- [x] **T5** — Front: tipos, hooks (`["goals"]`), Zod, `GoalProgress`, lista `/metas`, formulário de meta
  - Verificação: CA1, CA6 no Playwright com a API simulada; estados; 375 e 1440 px; dois temas
- [x] **T6** — Front: detalhe `/metas/:id`, aportes (diálogo, editar, excluir), excluir meta
  - Verificação: CA2–CA5 no Playwright
- [x] **T7** — Front: navegação (P1: Metas no lugar de Categorias no celular, link "Gerenciar categorias" em Contas) e `GoalsHomeBlock` no `PanelPage` (relendo depois do commit da 2c)
  - Verificação: CA8; navegação nos dois tamanhos
- [x] **T8** — Revisões `security` e `qa`; build, testes, typecheck, lint e build do `web`
- [x] **T9** — ROADMAP, CHANGELOG e LICOES atualizados (L33 e L34); pendência técnica T13 registrada

## Registro

| Task | Commit | Observação |
|---|---|---|
| T0 | | Spec e plano aprovados pelo Pedro em 2026-10-18 (plano revisado pela 2c) |
| T1 | c504e5e | SQL aprovado pela 2c; **aplicada no banco em 2026-10-18** com o OK do Pedro |
| T2 | bd26057 | Aprovado pela 2c; Domain 138/138 |
| T3 | 5a26efb | Aprovado pela f2; Application 171/171 |
| T4 | 48c1430 | GoalStore + GoalsController + DI; 4 testes de integração novos (progresso somado no banco, ordem da RN8, editar/excluir inexistente, outro usuário não lê nem altera); integração 28/28 |
| T8 | (este) | `security` **APROVADO** (sem crítico nem alto; CA-seg coberto). `qa` pronto com ressalvas: corrigidos o 100% da barra com a meta em andamento, o contraste do hover do botão destrutivo (4,22 escuro / 3,63 claro → 6,40 / 5,57), o hover do cartão de meta (income caía para 4,27:1 no claro → hover passou a acender a borda), `text-expense` no "Prazo encerrado" (cor de dinheiro → `text-destructive`), alvo de 44 px no "Ver todas", rótulo do skeleton do detalhe, `min` do calendário na edição, Esc/fundo fechando o diálogo durante o salvamento, `max-h` no `DialogContent`, contagem redundante de aportes e recarga em 404 de mutação. Ficou de fora: `localStorage` de "última conta" sobrevive ao logout (pré-existente, fora da spec — vai para pendências técnicas) |
| T5–T7 | (este) | Front completo numa sessão só (back + front): `features/goals/` (tipos, hooks `["goals"]`, `GoalProgress`, `deadline-note`, cartão, lista, formulário, detalhe, aportes, excluir, bloco do Início), Zod em `lib/validations/goals.ts`, 4 rotas em `lazy()`, `components/ui/dialog.tsx` (Base UI Dialog, sem dependência nova), P1 da navegação e "Gerenciar categorias" em Contas. typecheck, lint e build do `web` verdes |
