# Spec 005 — Dashboard

> **O QUE** fazer e **como saber que está pronto.** Nada de detalhe técnico aqui: isso vai no [plan.md](plan.md).

- **Etapa do roadmap:** Etapa 6 — Dashboard
- **Status:** Aprovada (2026-10-17: o Pedro delegou as decisões para fechar o MVP numa sessão; as respostas abaixo seguem a recomendação)
- **Data:** 2026-10-17

## Problema

O objetivo 4 da [VISAO](../../VISAO.md) é **"Entender o mês"**: saldo total, receitas × despesas e gastos por categoria. Com contas, categorias e transações prontas (specs 002 e 004), o `/painel` ainda é só um "Olá" com atalhos. A pessoa precisa abrir o app e, em 5 segundos, saber **quanto tem**, **quanto deve no cartão** e **para onde o dinheiro foi** no mês.

## Histórias de usuário

- Como **usuário**, quero ver o meu saldo total ao abrir o app, para saber quanto dinheiro tenho de verdade.
- Como **usuário**, quero ver a dívida do cartão separada do saldo, para não achar que tenho mais do que tenho.
- Como **usuário**, quero comparar o que entrou e o que saiu no mês, para saber se estou gastando mais do que ganho.
- Como **usuário**, quero ver quanto gastei em cada categoria, para decidir onde cortar.

## Escopo

### Dentro
- **Início (`/painel`) vira o dashboard:** saldo total, dívida do cartão, receitas × despesas do mês com o resultado, gastos por categoria e o atalho "Nova transação".
- **Troca de mês** no bloco do mês (‹ outubro de 2026 ›), com o mês no endereço (`?mes=`).
- **Estados:** carregando (skeleton), erro, sem contas (primeiros passos) e mês sem gastos.
- **Layout de desktop** em duas colunas.

### Fora (explicitamente)
- Metas no dashboard: entram com a Etapa 7 (spec 006).
- Evolução ao longo dos meses (gráfico de linha), comparação com o mês anterior, orçamento por categoria, previsões.
- Exportar relatório.

## Regras de negócio

- **RN1 — Saldo total:** soma o saldo atual das contas **corrente, poupança e dinheiro**. O **cartão fica fora** (ADR 0007). Pode ser negativo (cheque especial).
- **RN2 — Dívida do cartão:** soma o saldo dos cartões e mostra como dívida ("Você deve R$ 640,90"). Sem cartões cadastrados, o bloco não aparece. Cartão com saldo zero aparece como "Nenhuma dívida".
- **RN3 — Mês:** receitas e despesas do mês escolhido, sem transferências (ADR 0007), e o **resultado** (receitas − despesas), com sinal.
- **RN4 — Gastos por categoria:** só **despesas** do mês, agrupadas por categoria, da maior para a menor, com o valor e a fatia do total. Despesas cuja categoria foi excluída somam em **"Sem categoria"**.
- **RN5 — Soma no banco:** todos os totais são somados no banco (ADR 0006), nunca no front.
- **RN6 — Mês padrão:** o mês atual de São Paulo. Não avança além dele (igual à lista de transações).

## Telas e estados

| Tela | Rota | Estados obrigatórios | Observações |
|---|---|---|---|
| Início (dashboard) | `/painel?mes=2026-10` | skeleton · erro · sem contas · mês sem gastos · sucesso | Celular: "Olá, Pedro" → saldo total → dívida do cartão → mês (‹ › + receitas, despesas, resultado e barra de comparação) → gastos por categoria. Desktop: saldos à esquerda, mês e categorias à direita |
| Sem contas | `/painel` | — | "Comece cadastrando suas contas" + "Adicionar conta" (primeiros passos) |

Todas em **375 px** e **1440 px**, temas **claro e escuro**. Textos em **português do Brasil**, com acento.

## Critérios de aceite

- [ ] **CA1** — Com Nubank (R$ 2.500,00), Reserva (R$ 10.000,00) e Cartão (dívida de R$ 640,90), o saldo total mostra **R$ 12.500,00** e a dívida do cartão **R$ 640,90**, em blocos separados.
- [ ] **CA2** — Uma conta corrente no cheque especial reduz o saldo total (pode ficar negativo, com o sinal "−").
- [ ] **CA3** — Com R$ 3.000,00 de receita e R$ 255,80 de despesa em outubro, o bloco do mês mostra **+R$ 3.000,00**, **−R$ 255,80** e o resultado **+R$ 2.744,20**. Uma transferência no mês não muda nenhum deles.
- [ ] **CA4** — Os gastos por categoria listam só as despesas do mês, da maior para a menor, com valor e porcentagem; despesa "Sem categoria" aparece como tal.
- [ ] **CA5** — ‹ › troca o mês do bloco do mês e dos gastos, e o endereço (`?mes=`); o saldo total e a dívida não mudam (são de hoje).
- [ ] **CA6** — Sem nenhuma conta, o Início mostra os primeiros passos em vez de saldos zerados.
- [ ] **CA7** — Lançar uma despesa e voltar ao Início mostra o saldo, o mês e os gastos já atualizados.
- [ ] **CA-seg** — Os totais são só do usuário logado (RLS + filtro por `user_id`); revisão do agente `security` sem críticos ou altos.
- [ ] **CA-a11y** — 375 px, dois temas; valores com sinal e ícone (nunca só a cor); as barras têm o valor e a porcentagem em texto; contraste ≥ 4,5:1.
- [ ] **CA-build** — `dotnet build api`, `dotnet test api`, `typecheck`, `lint` e `build` do `web` passam.

## Perguntas em aberto

Respondidas em 2026-10-17 conforme a recomendação (decisões delegadas pelo Pedro):

- [x] **P1 — Gráfico:** pizza/rosca (Recharts) ou barras horizontais? (**Barras horizontais em HTML/CSS:** comparam melhor tamanhos parecidos, levam o nome e o valor em texto, funcionam no leitor de tela e não exigem biblioteca nova. [ADR 0018](../../adr/0018-grafico-de-categorias-sem-biblioteca.md).)
- [x] **P2 — Mês no dashboard:** só o mês atual ou com ‹ ›? (**Com ‹ ›**, reaproveitando o componente da lista de transações.)
- [x] **P3 — Atalhos de Contas e Categorias no Início:** manter? (**Não:** a navegação já tem os dois; o Início fica com o resumo e "Nova transação".)
