# Spec 004 — Transações

> **O QUE** fazer e **como saber que está pronto.** Nada de detalhe técnico aqui: isso vai no [plan.md](plan.md).

- **Etapa do roadmap:** Etapa 5 — Transações
- **Status:** Aprovada (2026-10-17)
- **Data:** 2026-10-17

## Problema

A segunda pergunta da [VISAO](../../VISAO.md) é **"Para onde o meu dinheiro está indo?"**. Com contas e categorias prontas (spec 002), falta o essencial: **registrar o que entra, o que sai e o que passa de uma conta para outra** (objetivo 3 do MVP). Sem transações, o saldo das contas fica parado no saldo inicial e o dashboard da Etapa 6 não tem o que somar.

O hábito decide o produto: "lançar uma despesa leva no máximo **3 toques**" (VISAO). As métricas de ativação (1ª transação em 24 h) e de hábito (1 por semana) dependem disso.

## Histórias de usuário

- Como **usuário**, quero lançar uma despesa em segundos (valor, categoria, pronto), para não desistir do hábito.
- Como **usuário**, quero lançar uma receita (salário, freelance), para o saldo da conta ficar certo.
- Como **usuário**, quero registrar uma transferência entre minhas contas (ex.: pagar a fatura do cartão com a conta corrente, guardar na poupança), sem que isso conte como gasto.
- Como **usuário**, quero ver as transações do mês, agrupadas por dia, e filtrar por categoria, para entender para onde o dinheiro foi.
- Como **usuário**, quero corrigir ou excluir uma transação lançada errado.

## Escopo

### Dentro
- **Transações:** listar por mês, criar, editar e excluir. 3 tipos: **despesa**, **receita** e **transferência**.
- **Lista do mês:** navegação entre meses (‹ outubro de 2026 ›), agrupada por dia, com o total de receitas e despesas do mês no topo e filtro por categoria.
- **Lançamento rápido:** botão "Nova transação" sempre à mão (navegação e Início), formulário que abre com o valor em foco.
- **Saldo das contas** passa a refletir as transações (a soma já existe no banco).
- **Navegação:** novo item "Transações".

### Fora (explicitamente)
- Transações recorrentes, compras parceladas, fatura de cartão (fechamento e vencimento), anexos e comprovantes, importação de extrato (OFX/CSV), busca por texto e filtro por conta — conferir "Fora do escopo do MVP" na VISAO.
- Gráficos e o resumo do mês com saldo total: são a Etapa 6 (Dashboard).
- Desfazer a exclusão.

## Regras de negócio

- **RN1 — Tipos:** despesa, receita e transferência.
  - Despesa e receita acontecem **numa conta** e têm uma **categoria do mesmo tipo** (despesa só com categoria de despesa).
  - Transferência sai de uma conta e entra em **outra** conta (nunca a mesma) e **não tem categoria**: não é gasto nem ganho.
- **RN2 — Valor:** obrigatório, **maior que zero**, até R$ 999.999.999,99, sempre em centavos exatos. É digitado positivo; o sentido vem do tipo.
- **RN3 — Efeito no saldo:** receita soma na conta; despesa subtrai; transferência subtrai da origem e soma no destino. No **cartão de crédito**, despesa aumenta a dívida, e uma transferência **para** o cartão (pagar a fatura) diminui a dívida.
- **RN4 — Data:** obrigatória, padrão **hoje**, e **nunca no futuro** (P1): contas futuras seriam recorrência, fora do MVP, e o saldo somaria o que ainda não aconteceu.
- **RN5 — Descrição:** opcional, até 100 caracteres (ex.: "Mercado do bairro").
- **RN6 — Categoria:** **obrigatória** em despesa e receita (P2), com a última categoria usada daquele tipo já sugerida. Uma transação cuja categoria foi excluída aparece como **"Sem categoria"** (RN11 da spec 002) e pode receber outra categoria na edição.
- **RN7 — Totais do mês:** somam só receitas e despesas; **transferências ficam fora** (ADR 0007). A soma é feita no banco, nunca no front.
- **RN8 — Edição:** muda valor, data, descrição, conta e categoria. O tipo troca **só entre despesa e receita** (P3), e a categoria precisa ser escolhida de novo; transferência não vira despesa nem receita (nem o contrário): exclui e lança de novo.
- **RN9 — Exclusão:** pede confirmação curta ("Excluir esta despesa de R$ 45,90? Não dá para desfazer."). Some do saldo e dos totais.
- **RN10 — Dono:** conta, conta de destino e categoria precisam ser **da própria pessoa**. Id de outra pessoa é recusado como se não existisse.
- **RN11 — Saldo negativo não bloqueia:** lançar uma despesa maior que o saldo é permitido (o app registra a realidade, não a impede).

## Telas e estados

Todas em **375 px** e **1440 px**, temas **claro e escuro**, com **carregando (skeleton)**, **vazio**, **erro** e **sucesso**.

| Tela | Rota | Estados obrigatórios | Observações |
|---|---|---|---|
| Transações do mês | `/transacoes?mes=2026-10` | skeleton · vazio do mês · erro · lista | Topo: ‹ mês › + receitas e despesas do mês (com sinal e ícone). Lista agrupada por dia ("Hoje", "Ontem", "sexta, 10 de outubro"), cada item com o `CategoryBadge` (ou ícone de transferência), descrição ou nome da categoria, conta e valor com sinal (+/−). Filtro por categoria. Vazio: "Nenhuma transação em outubro" + "Nova transação" |
| Nova transação | `/transacoes/nova` | salvando · erro ao salvar · erro por campo | Abas Despesa (padrão) / Receita / Transferência; **valor em foco ao abrir**; categoria numa grade do tipo escolhido; conta (lembra a última usada); data (hoje); descrição opcional. Transferência troca categoria por "De" e "Para" |
| Editar transação | `/transacoes/:id` | carregando · erro · não encontrada | Mesmo formulário preenchido, com "Excluir transação" |
| Confirmação de exclusão | (diálogo) | excluindo · erro | Texto da RN9, "Cancelar" com foco inicial |
| Navegação | todas as rotas logadas | — | Celular: Início, **Transações**, Contas, Categorias, e o botão "Nova transação" sempre visível. Desktop: no menu lateral |
| Sem contas | `/transacoes/nova` | — | Sem nenhuma conta: "Cadastre uma conta antes de lançar" + "Adicionar conta" |

Textos da interface em **português do Brasil**, com acento.

## Critérios de aceite

- [ ] **CA1** — Do Início, lançar uma despesa de R$ 45,90 em "Alimentação" na conta "Nubank" leva **no máximo 3 toques** depois de digitar o valor (abrir, valor, categoria, salvar), e ela aparece na lista de hoje com **−R$ 45,90**.
- [ ] **CA2** — Depois do CA1, a lista de contas mostra o saldo do Nubank **R$ 45,90 menor**.
- [ ] **CA3** — Uma receita de R$ 3.000,00 em "Salário" soma na conta e aparece com **+R$ 3.000,00**.
- [ ] **CA4** — Uma transferência de R$ 500,00 do Nubank para a Reserva tira R$ 500,00 de uma e põe na outra, **não aparece nos totais do mês** e não tem categoria.
- [ ] **CA5** — Uma transferência da conta corrente **para o cartão** diminui a dívida do cartão pelo valor transferido.
- [ ] **CA6** — Valor zero, vazio ou acima de R$ 999.999.999,99, conta ausente, despesa com categoria de receita e transferência para a mesma conta são recusados **no formulário e na API**, com mensagem no campo.
- [ ] **CA7** — A lista de outubro mostra só as transações de outubro, agrupadas por dia, com os totais de receitas e despesas do mês; ‹ › troca o mês e o endereço (`?mes=`).
- [ ] **CA8** — Filtrar por "Alimentação" mostra só as despesas dessa categoria, e o filtro fica no endereço.
- [ ] **CA9** — Editar o valor de uma despesa atualiza a lista, os totais e o saldo da conta.
- [ ] **CA10** — Excluir uma transação pede confirmação curta; confirmada, ela some da lista, dos totais e do saldo.
- [ ] **CA11** — Abrir `/transacoes/<id de outra pessoa>` mostra "não encontrada"; criar ou editar com a conta ou a categoria de outra pessoa é recusado (a API responde como inexistente).
- [ ] **CA12** — Uma transação cuja categoria foi excluída aparece como "Sem categoria" e pode receber uma categoria na edição.
- [ ] **CA-seg** — Um usuário não lê nem altera transações de outro (RLS + filtro por `user_id`); revisão do agente `security` sem achados críticos ou altos.
- [ ] **CA-a11y** — Funciona em 375 px, nos dois temas; o tipo e o valor nunca dependem só da cor (sinal +/− e ícone); alvos de toque ≥ 44 px; o valor recebe o foco ao abrir o formulário.
- [ ] **CA-build** — `dotnet build api`, `dotnet test api`, `typecheck`, `lint` e `build` do `web` passam.

## Perguntas em aberto

Respondidas pelo Pedro em 2026-10-17: **todas conforme a recomendação**.

- [x] **P1 — Data no futuro:** permitir lançar com data futura? O saldo da conta soma todas as transações, então uma despesa do dia 30 já sairia do saldo hoje. (**Recomendo: não.** Data até hoje; contas futuras são recorrência, que está fora do MVP.)
- [x] **P2 — Categoria obrigatória:** despesa e receita exigem categoria? (**Recomendo: sim**, com a última categoria usada já sugerida: a meta da VISAO é 90% das transações com categoria. "Sem categoria" só aparece quando a categoria é excluída.)
- [x] **P3 — Trocar o tipo na edição:** permitir mudar despesa ↔ receita ao editar? (**Recomendo: sim entre despesa e receita**, limpando a categoria; transferência ↔ despesa/receita **não**: para isso, excluir e lançar de novo.)
- [x] **P4 — Navegação com 4 itens:** "Transações" entra como 2º item da barra inferior, e o botão "Nova transação" fica no centro da barra (celular) e no topo do menu lateral (desktop)? (**Recomendo: sim.** O botão central atende os "3 toques".)
- [x] **P5 — Início:** o atalho "Nova transação" entra no topo do Início até o dashboard da Etapa 6? (**Recomendo: sim.**)
