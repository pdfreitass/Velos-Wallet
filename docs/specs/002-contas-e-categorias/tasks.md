# Tasks — Spec 002: Contas e categorias

> Passos **pequenos e verificáveis**, derivados do [plan.md](plan.md). Cada task deve caber num commit.
> Marque `[x]` ao concluir e anote o hash do commit. Ao terminar uma task: parar, mostrar e esperar aprovação.

**Branch:** `devpedro`

## Preparação
- [x] **T0** — Spec e plano aprovados (2026-10-15), P1–P4 resolvidas
  - Verificação: status da [spec.md](spec.md) e do [plan.md](plan.md) = **Aprovada**

## Banco
- [x] **T1** — Migration `0009_contas_e_categorias.sql`: cheque especial, cartão só com dívida, tamanho dos nomes, nome de categoria único sem maiúsculas, FK da T11 com `set null (category_id)`
  - Verificação: `npx supabase db push --dry-run` lista só a `0009`
  - Extra: `0010_categoria_tipo_on_delete.sql` — a segunda FK `(category_id, type)` também bloqueava a exclusão; agora `set null (category_id)`
- [x] **T2** — Aplicar (**com aprovação do Pedro**) — `0009` e `0010` aplicadas (`migration list` sincronizado); `AccountCategoryRulesTests` 4/4
  - Verificação: `migration list` sincronizado; por SQL numa transação desfeita: corrente negativa aceita, poupança negativa recusada, "lazer"/"Lazer" de despesa recusado, excluir categoria com transação deixa `category_id` nulo

## API
- [x] **T3** — Domain: `AccountType`, `AccountRules`, `CategoryRules`, `CategoryCatalog` + testes
  - Verificação: `dotnet test` (sinal do saldo por tipo, limites, catálogo)
  - Também `CategoryType` (só despesa/receita). Catálogo: 12 cores (10 do seed + 2) e 30 ícones do lucide, conferidos no `node_modules`
- [x] **T4** — Application de contas: `IAccountStore`, casos de uso, validadores + testes com dublês
  - Verificação: `dotnet test`; usuário sempre do `IUserContext`; 404 igual para alheio e inexistente
  - Os handlers entram no DI só na T6, junto com o `AccountStore`: em Development o `ValidateOnBuild` impede a API de subir sem a implementação
- [ ] **T5** — Application de categorias: `ICategoryStore`, casos de uso, validadores + testes
  - Verificação: `dotnet test`; `409 category_name_taken`
- [ ] **T6** — Infrastructure: `AccountStore` e `CategoryStore` + testes de integração (`Tests:UserId` da conta de teste)
  - Verificação: CRUD real; outro usuário não lê nem altera; impacto da exclusão conta os dois lados da transferência; cada teste limpa o que criou
- [ ] **T7** — Api: `AccountsController`, `CategoriesController`, `Velos.Api.http`
  - Verificação: chamadas reais (curl) para cada rota, incluindo id alheio → 404 e sem CSRF → 400

## Interface
- [ ] **T8** — Base: componentes shadcn (`alert-dialog`, `checkbox`, `radio-group`, `skeleton`), mensagens de erro em `lib/api/errors.ts`, botões com 44 px (pendência T8 do ROADMAP)
  - Verificação: typecheck, lint; nenhum pacote novo no `package.json`
- [ ] **T9** — `MoneyInput`, catálogo e paleta das categorias (tokens claro/escuro com contraste medido), `CategoryBadge`
  - Verificação: 0,01 / 0,10 / 999.999.999,99 exatos; ícone ≥ 3:1 nos dois temas
- [ ] **T10** — Navegação: `AppLayout`, `AppNav` (barra inferior / menu lateral) e o `/painel` com atalhos (P4)
  - Verificação: 375 e 1440 px, dois temas; item atual marcado além da cor; a barra não cobre conteúdo
- [ ] **T11** — Contas: lista, formulário (RN3 por tipo, cheque especial) e diálogo de exclusão detalhado (RN6)
  - Verificação: CA1, CA1b, CA2–CA6b; skeleton, vazio e erro
- [ ] **T12** — Categorias: lista, formulário com cor e ícone, diálogo de exclusão (RN11)
  - Verificação: CA7–CA10; skeleton, vazio e erro

## Fechamento
- [ ] **T13** — ADR 0017 (excluir conta apaga as movimentações)
- [ ] **T14** — Todos os critérios de aceite em 375 e 1440 px, temas claro e escuro (CA1–CA12)
- [ ] **T15** — Agentes `security` (CA-seg, IDOR) e `qa` (CA-a11y, CA-build)
- [ ] **T16** — `dotnet build api`, `dotnet test api`, `typecheck`, `lint` e `build` do `web`
- [ ] **T17** — Atualizar [ROADMAP](../../ROADMAP.md), [CHANGELOG](../../CHANGELOG.md), [LICOES](../../LICOES.md) e [ARQUITETURA](../../ARQUITETURA.md)
- [ ] **T18** — PR para `main` com descrição e checklist de testes

## Registro

| Task | Commit | Observação |
|---|---|---|
| T0 | | Spec e plano aprovados pelo Pedro em 2026-10-15 |
| T1 | `a7607da` | `0009` + `0010` (a segunda FK foi achada pelo teste de integração) |
| T2 | `a7607da` | Aplicadas em 2026-10-17; `AccountCategoryRulesTests` 4/4 verdes |
| T3 | `f7d5ccd` | Domain.Tests 100/100; build sem aviso |
| T4 | | Application.Tests 94/94; um validador (`AccountInput`) para criar e editar |
