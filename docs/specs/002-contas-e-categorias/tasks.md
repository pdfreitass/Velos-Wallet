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
- [x] **T5** — Application de categorias: `ICategoryStore`, casos de uso, validadores + testes
  - Verificação: `dotnet test`; `409 category_name_taken`
  - O store devolve o `category_name_taken` genérico; o handler troca pela mensagem do tipo (CA9), com o erro no campo `name`
- [x] **T6** — Infrastructure: `AccountStore` e `CategoryStore` + testes de integração (`Tests:UserId` da conta de teste)
  - Verificação: CRUD real; outro usuário não lê nem altera; impacto da exclusão conta os dois lados da transferência; cada teste limpa o que criou
  - Também `StoreGuard` (erro do Postgres → `AppError`, sem a mensagem crua), `PgEnums`, handlers e stores no DI (API sobe com `ValidateOnBuild`)
- [x] **T7** — Api: `AccountsController`, `CategoriesController`, `Velos.Api.http`
  - Verificação: chamadas reais (curl) para cada rota, incluindo id alheio → 404 e sem CSRF → 400
  - Enums no JSON em camelCase (`checking`, `creditCard`, `expense`); tipo inválido vira erro de campo (`ApiEnums`). Id alheio → 404 provado na T6 (banco) e nos handlers

## Interface
- [x] **T8** — Base: componentes shadcn (`alert-dialog`, `checkbox`, `radio-group`, `skeleton`), mensagens de erro em `lib/api/errors.ts`, botões com 44 px (pendência T8 do ROADMAP)
  - Verificação: typecheck, lint; nenhum pacote novo no `package.json`
  - Também a pendência T10 do ROADMAP: no tema escuro, despesa/destrutivo `#F08084` (4,68:1 no card) e borda de campo `#718F85` (3,44:1 no card). Diálogo como folha inferior no celular (mockup). `applyServerFieldErrors` foi junto para `lib/api/errors.ts`
- [x] **T9** — `MoneyInput`, catálogo e paleta das categorias (tokens claro/escuro com contraste medido), `CategoryBadge`
  - Verificação: 0,01 / 0,10 / 999.999.999,99 exatos; ícone ≥ 3:1 nos dois temas
- [x] **T10** — Navegação: `AppLayout`, `AppNav` (barra inferior / menu lateral) e o `/painel` com atalhos (P4)
  - Verificação: 375 e 1440 px, dois temas; item atual marcado além da cor; a barra não cobre conteúdo
- [x] **T11** — Contas: lista, formulário (RN3 por tipo, cheque especial) e diálogo de exclusão detalhado (RN6)
  - Verificação: CA1, CA1b, CA2–CA6b; skeleton, vazio e erro
- [x] **T12** — Categorias: lista, formulário com cor e ícone, diálogo de exclusão (RN11)
  - Verificação: CA7–CA10; skeleton, vazio e erro

## Fechamento
- [x] **T13** — ADR 0017 (excluir conta apaga as movimentações)
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
| T4 | `067a0d3` | Application.Tests 94/94; um validador (`AccountInput`) para criar e editar |
| T5 | `1468d76` | Application.Tests 113/113 |
| T6 | `373741f` | `StoreTests` 8/8 no banco real (rodado pelo Pedro); `dotnet run` sobe |
| T7 | `b01fe36` | curl sem sessão (401) e sem CSRF (400); 27/27 chamadas logadas pelo Chrome do Pedro, dados de teste apagados |
| T8 | `5e1b3a9` | typecheck, lint e build verdes; package.json sem mudança; todos os botões medidos com alvo ≥ 44 px na página inicial |
| T9 | `7acc32b` | `MoneyInput`: 0,01 / 0,10 / 999.999.999,99 exatos, tecla acima do teto ignorada; 12 cores com ícone ≥ 3:1 nos dois temas (todas precisaram de tom ajustado em pelo menos um tema, só na exibição; banco intocado); typecheck, lint e build verdes; package.json sem mudança |
| T10 | `fe167a6` | 375 e 1440 px, temas claro e escuro: item atual com cor + traço + ícone mais grosso e `aria-current`; com conteúdo longo o último item fica 39 px acima da barra; alvos ≥ 44 px; 1º Tab = "Pular para o conteúdo"; o "não encontrado" passou para dentro da casca (Contas/Categorias caem nele até a T11/T12); verificado no Playwright com `/api/me` simulado; typecheck, lint e build verdes |
| T11 | `f4980ae` | Front verificado no Playwright com a API de contas simulada (contrato da T7): CA1, CA1b, CA2, CA3 (0,10 volta 0,10), CA4 no formulário (vazio, espaços, 41 caracteres), CA5, CA6, CA6b (fatos, foco em Cancelar, botão só com "Entendi", Esc fecha), CA11 (GUID alheio e id inválido); o front envia o saldo com sinal (-35000 no cheque especial, -64090 no cartão); erro por campo da API vai para o campo com foco; skeleton, vazio e erro; 375 e 1440 px, dois temas; alvos ≥ 44 px. **Pendente com login real:** CA4 na API e CA6b com movimentações preparadas por SQL (T14). `FormField`/`FormAlert` movidos para `components/shared` |
| T12 | `0bbb73c` | Front verificado no Playwright com a API de categorias simulada (10 padrão, 409 por nome repetido no tipo sem diferenciar maiúsculas): CA7 (abas Despesas · 7 / Receitas · 3, setas trocam a aba e o endereço), CA8 (pré-visualização igual à da lista), CA9 ("lazer" de despesa recusado com o erro no campo e foco; "Lazer" de receita aceito), CA10 (diálogo com 14 movimentações → "Sem categoria", e curto sem elas; foco em Cancelar), CA11; vazio por tipo abre o formulário já em Receita; skeleton e erro; 42 botões de cor/ícone com 44 px e `aria-pressed`; 375 e 1440 px, dois temas. **Pendente com login real:** CA9 e CA10 contra a API e o banco (T14). `FormPageShell` extraído para `components/shared` |
| T13 | | [ADR 0017](../../adr/0017-excluir-conta-apaga-movimentacoes.md): cascata pelas duas FKs de `transactions`, efeito nas transferências (registro único, ADR 0007), metas sem ligação a contas (conferido na 0001); alternativas: arquivar, bloquear, deixar órfãs, lixeira |
| UI | | Mockup HTML das 12 telas (Início, Contas, Nova/Editar conta, Excluir conta detalhado e curto, Categorias, Nova categoria, Excluir categoria, estados carregando/vazio/erro/não encontrado, desktop) aprovado pelo Pedro em 2026-10-17; referência para T8–T12 |
