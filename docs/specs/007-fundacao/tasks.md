# Tarefas — Spec 007: Fundação

> Uma task por vez. Ao terminar cada uma, **parar e mostrar** antes da próxima.
> Marcar `[x]` só depois de verificar. Spec: [spec.md](spec.md) · Plano: [plan.md](plan.md).
> **Pontos de parada que exigem seu "pode":** T4 (acesso ao banco para o ensaio), T6 (aplicar em produção), T9 (instalar Vitest), T12 (instalar Mvc.Testing).

## Banco (A0.2)

> **SUSPENSAS (2026-10-19).** A T1 achou no banco as migrations `0009`–`0013` (contas, transações, dashboard, metas), que **não estão no repositório nem no GitHub**. Elas já resolvem T11 e T1 do ROADMAP, e a `0009` deste plano colidiria com a existente. T1 a T7 só voltam depois de recuperar esse código e refazer a auditoria do que mudou; a nova migration, se ainda for preciso (FI-01 segue aberto: as FKs de conta continuam `on delete cascade`), será a `0014`.

- [ ] **T1 — Conferir o estado atual do banco antes de escrever o SQL.**
  Somente leitura: contagem de linhas em `accounts`, `transactions`, `goals`, `goal_contributions`, nomes reais das FKs de `transactions` e `npx supabase migration list` (confirma que a `0008` é a última).
  *Verifica:* relatório mostrado; decide se os CHECKs precisam de `not valid`.
  *Precisa de:* leitura no banco (mesma pergunta da T4, respondida uma vez para as duas).

- [ ] **T2 — Escrever `supabase/migrations/0009_integridade_e_arquivamento.sql`** (arquivo novo, ainda **não aplicado**).
  `archived_at`, FKs de conta em `no action`, FK de categoria com `set null (category_id)`, `updated_at` + trigger, `date` sem default, CHECKs de teto. Comentários no estilo das migrations anteriores.
  *Verifica:* leitura do SQL por você; nenhuma migration antiga editada.

- [ ] **T3 — Escrever o bloco de ensaio** (texto, fora de `supabase/migrations/`): `begin; <0009>; <verificações CA1–CA7 e CA4>; rollback;`.
  *Verifica:* bloco mostrado a você, com cada verificação ligada ao seu CA.

- [ ] **T4 — Rodar o ensaio (desfeito no fim).**
  **Pergunta antes:** conector do Supabase, ou você roda no SQL Editor e me traz o resultado?
  *Verifica:* todas as verificações passam e a saída confirma o `rollback` (nada persistiu: `0009` ainda não existe no banco).

- [ ] **T5 — ADR 0017** (`docs/adr/0017-exclusao-de-conta-arquivar-e-no-action.md`, do template).
  *Verifica:* ADR coerente com o resultado do ensaio.

- [ ] **T6 — Aplicar a `0009`.**
  `npx supabase db push --dry-run` → mostro a saída → **você diz "pode aplicar"** → `npx supabase db push` → `migration list` confirma.
  *Verifica:* CA8 (só a `0009` pendente antes; views com `security_invoker` e 23 policies depois).

- [ ] **T7 — Testes de integração `SchemaIntegrityTests`** (CT-01, 02, 03, 05, 07), tudo dentro da sessão do usuário de teste e desfeito por exceção no fim. Sem connection string, são pulados.
  *Verifica:* `dotnet test api` passa localmente com o banco; CA1, CA2, CA3, CA5, CA6, CA7. Conferir depois, com `select`, que **nenhuma linha de teste ficou**.

## Testes do front (A0.3)

- [x] **T8 — Confirmar a versão do Vitest** (`npm view vitest version` e compatibilidade com Vite 8) e mostrar a você.
  *Verifica:* versão e motivo mostrados.

- [x] **T9 — Instalar o Vitest e configurar** (`web/vitest.config.ts`, `globalSetup` de `TZ`, script `test`, tipos no tsconfig).
  *Precisa de:* seu "pode instalar" após a T8.
  *Verifica:* `npm run test --prefix web` roda (sem testes ainda) e `typecheck`/`lint` seguem verdes.

- [x] **T10 — Testes de `currency.ts`** (CT-15).
  *Verifica:* CA10 parte 1. Se algum teste achar bug real, **parar e mostrar** (não consertar às escondidas).

- [x] **T11 — Testes de `date.ts`**, em `America/Sao_Paulo` e em `UTC` (CT-16).
  *Verifica:* CA10 parte 2.

## Testes da API (A0.4)

- [x] **T12 — Criar `Velos.Api.Tests`** e instalar `Microsoft.AspNetCore.Mvc.Testing` 10.0.12; incluir na `Velos.slnx`; acrescentar `public partial class Program;` ao `Program.cs`; `ApiFactory` com ambiente `Testing` e configuração em memória.
  *Precisa de:* seu "pode instalar".
  *Verifica:* um teste mínimo sobe a API em memória sem tocar o banco nem o Supabase; `dotnet build api` verde.

- [x] **T13 — `PrivateByDefaultTests`:** lista fixa de rotas públicas e 401 nas demais.
  *Verifica:* CA11 (parte privada) e CA12. **Prova de que o teste protege:** criar temporariamente um controller público de brinde, ver o teste **falhar**, e remover.

- [x] **T14 — `CsrfAndHeadersTests`:** CSRF 400 `csrf_header_missing`, `/api/inexistente` em JSON, cabeçalhos de segurança.
  *Verifica:* CA11 (parte CSRF, 404 e cabeçalhos). Documentar o comportamento real quando 401 e 404 se cruzam.

## CI (A0.1)

- [x] **T15 — Criar `.github/workflows/ci.yml`** (jobs `api` e `web`, permissões mínimas, sem segredos).
  *Verifica:* leitura por você e validação de sintaxe do YAML.

- [ ] **T16 — Provar o CI.** Com seu aval, abrir um PR de teste: primeiro com um erro de lint de propósito (tem de ficar **vermelho**), depois corrigido (**verde**); confirmar que a integração foi pulada.
  *Verifica:* CA9. Inclui `git push` e PR: **só com seu "pode"**, e o PR de teste é fechado sem integrar.

## Fechamento

- [ ] **T17 — Verificação completa:** `dotnet build api`, `dotnet test api`, `typecheck`, `lint`, `test` e `build` do web.
  *Verifica:* CA-build, CA-seg. Revisão dos agentes `security` e `qa`, sem pendência crítica.

- [ ] **T18 — Documentação:** ROADMAP (T1 e T11 resolvidas; Fase 0 concluída), CHANGELOG, LICOES (o que deu errado ou quase), ARQUITETURA (tabelas, FKs, `archived_at`, testes, CI). Passos da branch protection (Q5) listados para você.
  *Verifica:* CA-docs; marcar a spec como **Concluída**.

- [ ] **T19 — Commits e PR.** Conventional Commits, um assunto por commit; branch `devpedro` atualizada com a `main`; `gh pr create` com descrição e checklist; **você integra**.
  *Verifica:* PR aberto, sem integrar por mim.

## Depois desta spec

Etapa 4 (contas e categorias, spec `002`): começa copiando `docs/specs/_template/` e esperando sua aprovação da spec.
