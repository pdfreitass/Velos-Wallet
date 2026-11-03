# Tasks — Spec 012: "E se você não tivesse gastado?"

> **Todas feitas em 2026-11-03.** Ver os critérios de aceite na [spec](spec.md),
> com a nota de como cada um foi verificado.

> Uma task por vez. Ao terminar cada uma: parar, mostrar, e só então seguir.
> `dotnet build api`, `dotnet test api`, `typecheck`, `lint` e `build` do `web` têm de passar antes de fechar qualquer task que mexa em código.

## Back

### T1 — Regra do corte no Domain
`api/src/Velos.Domain/Simulation/SimulationRules.cs`

- `MinPercent = 1`, `MaxPercent = 100`; `IsValidPercent(int)`.
- `MonthlySavingCents(long averageCents, int percent)` — arredonda ao centavo **uma vez** (RN6).
- `ProjectedCents(long monthlySavingCents, int months)` — multiplica o já arredondado.
- Testes em `Velos.Domain.Tests/Simulation/SimulationRulesTests.cs`: o caso do **CA1** (R$ 400 ⇒ 20% ⇒ R$ 80,00), o do **CA2** (6× e 12× batem com o mensal), o **CA8** (0% recusado, 100% aceito), e arredondamento com valor ímpar (ex.: 33% de R$ 100,01).

**Pronto quando:** testes do Domain passam e nenhuma outra camada foi tocada.

---

### T2 — Contrato e leitura da base
`ISimulationStore` + `SimulationStore`

- `GetAveragesAsync(Guid userId, DateOnly inicio, DateOnly fim, CancellationToken)`.
- A query do [plan.md](plan.md): `group by` no banco, `round(...::numeric / count(*))`, `left join` em `categories`, ordenada por média desc.
- `null` em `category_id` continua a ser "Sem categoria" (RN9).

**Pronto quando:** a query roda contra o banco real nos testes de integração e devolve médias certas para um usuário semeado com 3 meses.

---

### T3 — Handler
`api/src/Velos.Application/Simulation/GetSimulationBase.cs`

- Calcula a janela a partir de `TransactionRules.Today`: `fim` = primeiro dia do mês corrente, `inicio` = `fim - 3 meses` (RN1, CA5).
- Monta `SimulationBase { int ReferenceMonths, IReadOnlyList<CategoryAverage> Categories }`.
- Lista vazia ⇒ é o estado de dados insuficientes (RN4); o handler **não** inventa número.

**Pronto quando:** testes em `Velos.Application.Tests` cobrem **CA3** (nenhum mês completo), **CA4** (1 mês, `monthsCounted = 1`) e **CA5** (mês corrente não entra).

---

### T4 — Endpoint
`GET /api/simulation/base` em `SimulationController`

- Privado pela `FallbackPolicy`, como os outros; só leitura.
- Erro como `ProblemDetails`, via `this.ToProblem`.

**Pronto quando:** `dotnet test api` passa e a rota responde 401 sem sessão.

---

## Front

### T5 — Tipos, query e a matemática
`features/simulation/{types,api,simulation-math}.ts`

- `simulation-math.ts` espelha o `SimulationRules` do T1, com os mesmos arredondamentos.
- Teste que prende os dois: os números do **CA1** e do **CA2** escritos à mão, iguais aos do teste do Domain.

**Pronto quando:** `typecheck` e `lint` passam e o teste de paridade existe.

---

### T6 — Tela
`pages/SimulationPage.tsx` + componentes da feature

- Escolha de categoria (ordenada por média, sem marcar nada como cortável — RN2).
- 10 / 20 / 30 / livre, recalculando **em memória** (CA6).
- Resultado: mês · 6 meses · 12 meses, com o "se" visível (RN3).
- Estados: skeleton, **dados insuficientes** (RN4/RN5, dizendo em quantos meses a média se apoia), erro com "Tentar de novo".
- `aria-live` no resultado (CA-a11y). Valores com `text-income` e sinal, nunca só cor.

**Pronto quando:** 375 px nos dois temas, os três estados visíveis à mão, `lint` e `build` passam.

---

### T7 — Entradas e saída
`router.tsx`, `routes.ts`, bloco de categorias do Início, `GoalFormPage`

- Rota `/simular` (lazy) e `ROUTES.simulation`.
- Link no bloco "Gastos por categoria"; `?categoria=<id>` abre já na categoria.
- `GoalFormPage` aceita `?nome=` e `?valor=`; sem eles, nada muda (RN8).
- Botão "Transformar em meta" navega com os parâmetros e **não salva nada** (CA7).

**Pronto quando:** CA7 verificado à mão — formulário vem preenchido e nenhuma meta foi criada.

---

## Fecho

### T8 — Conferir os critérios de aceite
- Passar a lista **CA1–CA9**, **CA-seg**, **CA-a11y** e **CA-build** da [spec](spec.md), um a um, marcando.
- **CA-seg** com dois usuários de verdade.
- Semear os três cenários de dados (3 meses, 1 mês, nenhum) — em 2026-11 o cenário real do Pedro é "nenhum", então os outros dois precisam de dados semeados.

### T9 — Documentação
- [ROADMAP](../../ROADMAP.md), [CHANGELOG](../../CHANGELOG.md) e [LICOES](../../LICOES.md).
- Marcar a [I5](../../IDEIAS.md) como saída do caderno para spec.
- Status da spec para **Concluída**.
- Commit em Conventional Commits e PR para a `main`.
