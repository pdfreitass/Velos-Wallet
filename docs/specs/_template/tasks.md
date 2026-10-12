# Tasks — Spec NNN: Nome da feature

> Passos **pequenos e verificáveis**, derivados do [plan.md](plan.md). Cada task deve caber num commit.
> Marque `[x]` ao concluir e anote o hash do commit. Ao terminar uma task: parar, mostrar e esperar aprovação.

**Branch:** `devpedro`

## Preparação
- [ ] **T0** — Spec aprovada e perguntas em aberto resolvidas
  - Verificação: status da [spec.md](spec.md) = **Aprovada**

## Banco
- [ ] **T1** — Escrever migration `NNNN_nome.sql`
  - Verificação: `npx supabase db push --dry-run` lista só a migration nova
- [ ] **T2** — Aplicar e regenerar tipos
  - Verificação: `npx supabase migration list` sincronizado; `npm run types:db` sem diff inesperado

## Servidor
- [ ] **T3** — Schema Zod em `src/lib/validations/…`
  - Verificação: `npm run typecheck`
- [ ] **T4** — Queries em `src/server/queries/…`
  - Verificação: …
- [ ] **T5** — Server Actions em `src/server/actions/…`
  - Verificação: entrada inválida é rejeitada no servidor

## Interface
- [ ] **T6** — Página e componentes
  - Verificação: 375 px, tema claro e escuro, estados loading/vazio/erro

## Fechamento
- [ ] **T7** — Conferir todos os critérios de aceite da spec (CA1…CAn)
- [ ] **T8** — `npm run typecheck`, `npm run lint`, `npm run build` passam
- [ ] **T9** — Atualizar [ROADMAP](../../ROADMAP.md), [CHANGELOG](../../CHANGELOG.md) e [LICOES](../../LICOES.md)
- [ ] **T10** — Commit(s) Conventional Commits + PR para `main` com descrição e checklist de testes

## Registro

| Task | Commit | Observação |
|---|---|---|
| | | |
