# Plano técnico — Spec 012: "E se você não tivesse gastado?"

> **COMO** implementar a [spec.md](spec.md). Conferir contra [ARQUITETURA.md](../../ARQUITETURA.md), [LICOES.md](../../LICOES.md) e as [ADRs](../../adr/).

## Resumo da abordagem

A API devolve **uma base por categoria** — a média mensal dos últimos 3 meses completos, somada no banco — e o front faz a aritmética do corte enquanto o usuário move o percentual. Uma chamada ao abrir a tela, nenhuma a cada ajuste (CA6).

A regra do corte vive no **Domain**, em C#, e é testada lá. O front a reimplementa para o ajuste instantâneo, e um teste garante que as duas chegam ao mesmo número nos casos da spec — o mesmo arranjo que o projeto já usa entre as regras de transação e o Zod do front.

## Banco de dados

**Migration nova: nenhuma.**

A média sai de uma query no `SimulationStore`, com `group by` no banco (ADR 0006: somar no SQL), lendo `public.transactions` direto. **Não é view de propósito:** a janela de meses depende de "hoje em São Paulo", e esse fuso já tem uma fonte única — `TransactionRules.Today`, em C#. Uma view teria de repetir `America/Sao_Paulo` dentro do SQL, criando uma segunda fonte para a mesma regra. Os limites vão como parâmetro.

A query roda na transação com `role authenticated` + claims do JWT, como todas as outras, então a **RLS da `transactions` continua a valer** (CA-seg), e a `Application` filtra pelo usuário autenticado por cima.

Forma da query:

```sql
with meses as (
  select t.category_id,
         date_trunc('month', t.date)::date as mes,
         sum(t.amount_cents)::bigint as gasto_cents
  from public.transactions t
  where t.user_id = @userId
    and t.type = 'expense'
    and t.date >= @inicio   -- primeiro dia do 3.º mês completo atrás
    and t.date <  @fim      -- primeiro dia do mês corrente: exclui o mês incompleto (RN1)
  group by t.category_id, date_trunc('month', t.date)
)
select m.category_id,
       count(*)::int as meses_contados,
       round(sum(m.gasto_cents)::numeric / count(*))::bigint as media_cents
from meses m
group by m.category_id
order by media_cents desc
```

`round(...::numeric / count(*))` e **não** divisão inteira: `sum / count` em `bigint` trunca, e truncar centavos a cada categoria enviesa a média sempre para baixo.

O nome, cor e ícone da categoria vêm por `left join` em `public.categories`, como no `DashboardStore` — `null` é "Sem categoria" (RN9).

## Arquivos

| Ação | Caminho | Responsabilidade |
|---|---|---|
| criar | `api/src/Velos.Domain/Simulation/SimulationRules.cs` | a aritmética do corte e os limites do percentual |
| criar | `api/src/Velos.Application/Simulation/GetSimulationBase.cs` | handler: lê a base e monta a resposta |
| criar | `api/src/Velos.Application/Abstractions/ISimulationStore.cs` | contrato da leitura |
| criar | `api/src/Velos.Infrastructure/Persistence/SimulationStore.cs` | a query acima |
| criar | `api/src/Velos.Api/Controllers/SimulationController.cs` | `GET /api/simulation/base` |
| criar | `api/tests/Velos.Domain.Tests/Simulation/SimulationRulesTests.cs` | CA1, CA2, CA6, CA8 |
| criar | `api/tests/Velos.Application.Tests/Simulation/GetSimulationBaseTests.cs` | CA3, CA4, CA5 |
| criar | `web/src/features/simulation/api.ts` | query do TanStack |
| criar | `web/src/features/simulation/types.ts` | tipos da resposta |
| criar | `web/src/features/simulation/simulation-math.ts` | o mesmo cálculo do Domain, para o ajuste instantâneo |
| criar | `web/src/features/simulation/CategoryPicker.tsx` | escolha da categoria |
| criar | `web/src/features/simulation/CutPicker.tsx` | 10/20/30 + livre |
| criar | `web/src/features/simulation/SimulationResult.tsx` | mês · 6 meses · 12 meses |
| criar | `web/src/features/simulation/SimulationStates.tsx` | skeleton, dados insuficientes, erro |
| criar | `web/src/pages/SimulationPage.tsx` | a página |
| alterar | `web/src/router.tsx` | rota `/simular`, lazy como as outras |
| alterar | `web/src/lib/auth/routes.ts` | `ROUTES.simulation` |
| alterar | `web/src/features/dashboard/…` (bloco de categorias) | link para a simulação |
| alterar | `web/src/pages/GoalFormPage.tsx` | aceitar `?nome=` e `?valor=` (RN8) |

Nenhum componente passa de ~150 linhas (regra do CLAUDE.md).

## Fluxo de dados

```
/simular
  → GET /api/simulation/base
      → GetSimulationBaseHandler
          → TransactionRules.Today (fuso de São Paulo) → janela de 3 meses completos
          → ISimulationStore.GetAveragesAsync  → query com group by (soma no banco)
      → { referenceMonths, categories: [{ id, name, color, icon, monthsCounted, averageCents }] }
  → front guarda em cache; mover o percentual recalcula só em memória (CA6)

"Transformar em meta"
  → navega para /metas/nova?nome=…&valor=…   (nada é salvo — RN8)
```

## Validação

- **Percentual**: inteiro de **1 a 100** (RN7). Validado no Domain e espelhado no front; o 0 é recusado com mensagem em pt-BR (CA8).
- **Categoria**: tem de estar entre as devolvidas pela API. Como o cálculo é todo no front sobre dados que a própria API mandou, não há entrada de usuário a chegar ao banco nesta feature — é só leitura.
- O **banco** garante, como sempre, que só as transações do usuário são visíveis (RLS).

## Dependências novas

**Nenhuma.** Nem no NuGet nem no npm. É aritmética e componentes que já existem.

## Decisões

Não há decisão de porte de ADR. As duas escolhas que merecem registro estão na spec como RN1 (média dos meses completos) e RN6 (arredondar uma vez) e, se a janela de 3 meses mudar depois do uso real, isso é revisão da spec, não ADR.

## Riscos e armadilhas

- **Dinheiro**: tudo em centavos, `long` no C# e `number` inteiro no TS. Arredondar **uma vez só**, no valor mensal, e multiplicar o já arredondado (RN6) — senão 6× o que a tela mostra não bate com o que a tela mostra.
- **Datas**: a janela usa `TransactionRules.Today` e `DateOnly`; nunca `new Date("yyyy-MM-dd")` no front ([LICOES](../../LICOES.md)).
- **Divisão inteira no SQL**: ver acima. É o erro fácil desta feature.
- **Projeção virar promessa**: RN3 é de texto, e texto não quebra o build. Revisar as strings antes de fechar.
- **O mês corrente**: fácil deixar entrar por engano e fazer a média oscilar todo dia 1 (CA5 existe para isso).
- **Cálculo duplicado** front/back: é intencional, pelo CA6, mas precisa do teste que prende os dois aos mesmos números.
- **Dados reais são poucos** (8 transações, 2 dias, em 2026-11-03). Os testes cobrem os cenários; a tela só vai ter o que mostrar depois de semanas de uso. O estado de dados insuficientes (RN4) não é detalhe — hoje é o estado normal.

## Como testar

Manual, por critério de aceite da spec, com dados semeados nos três cenários: 3 meses completos, 1 mês completo, nenhum.

```bash
dotnet build api && dotnet test api
npm run typecheck --prefix web && npm run lint --prefix web && npm run build --prefix web
```

RLS: entrar com dois usuários e confirmar que a base devolvida só reflete as transações de quem está autenticado.
