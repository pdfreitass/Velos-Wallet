# Spec 010 — Rosca de categorias no Início

> **O QUE** fazer e **como saber que está pronto.** O detalhe técnico está no [plan.md](plan.md).

- **Etapa do roadmap:** Etapa 6 — Dashboard (revisão)
- **Status:** Concluída
- **Data:** 2026-11-02

## Problema

A **página inicial pública** mostra, dentro do iPhone desenhado em código, uma tela de exemplo com os gastos do mês numa **rosca**: o número de categorias no centro e a lista com nome, valor e porcentagem por baixo. É o que um visitante vê antes de criar conta.

O **app**, no Início, mostra a mesma informação em **barras horizontais**.

Em 2026-11-02 o Pedro abriu o Início, não reconheceu o bloco e disse que "o dashboard não está ali", mandando como referência a tela da vitrine. Se o dono do produto estranha, um usuário novo estranha também: **a página inicial promete um desenho e o app entrega outro.**

Liga ao objetivo da [VISAO](../../VISAO.md) de o usuário saber, num relance, para onde vai o dinheiro dele.

## Histórias de usuário

- Como **usuário**, quero ver num relance a proporção dos meus gastos do mês, para perceber onde está o peso sem ler número por número.
- Como **usuário** que veio da página inicial, quero que o app se pareça com o que me foi mostrado, para confiar no que vi.
- Como **usuário com muitas categorias**, quero que o gráfico continue legível, em vez de virar um mosaico de fatias de 1%.

## Escopo

### Dentro
- Rosca em `conic-gradient` acima da lista de gastos por categoria no **Início** (`/painel`).
- **Um componente de rosca partilhado** entre a vitrine da página inicial e o app.
- Agrupamento das categorias menores numa fatia **"Outras"**, para a rosca nunca passar de 6 fatias.
- Estados **vazio** (nenhuma despesa no mês) e **carregando** acompanhando o que o bloco já faz hoje.

### Fora (explicitamente)
- **Qualquer biblioteca de gráfico** (o [ADR 0019](../../adr/0019-rosca-de-categorias-em-css.md) mantém esta regra do [0018](../../adr/0018-grafico-de-categorias-sem-biblioteca.md)).
- Gráfico de **evolução no tempo** (linha), comparação entre meses, ou gráfico de receitas.
- Rosca em qualquer outra tela além do Início.
- Mudar os dados, a API ou as somas: a `/api/dashboard` já devolve tudo o que é preciso.
- Tornar a lista por baixo agrupada ou paginada — ela continua completa.

## Regras de negócio

- **RN1** — A rosca mostra **no máximo 6 fatias**: as **5 maiores** categorias e uma fatia **"Outras"** com a soma de todas as restantes. Com 6 ou menos categorias no mês, não há fatia "Outras" e cada categoria tem a sua.
- **RN2** — A **lista por baixo continua completa**, uma linha por categoria, na ordem de hoje (da maior para a menor). A rosca resume; a lista informa.
- **RN3** — A fatia **"Outras" não é clicável** e não aparece na lista: ela existe só no gráfico, porque não corresponde a nenhuma categoria real. As linhas da lista continuam a levar a `/transacoes` filtradas pela categoria e pelo mês.
- **RN4** — A rosca é **decorativa** (`aria-hidden`): nenhuma informação existe só nela. O leitor de tela lê a lista.
- **RN5** — No centro da rosca fica a **contagem de categorias do mês** (o total real, não o número de fatias) com o rótulo "categoria" ou "categorias", conforme o número.
- **RN6** — A cor de cada fatia é a **cor da categoria**, a mesma da linha correspondente na lista. A fatia "Outras" usa a cor neutra de "Sem categoria".
- **RN7** — "**Sem categoria**" (transações sem categoria) continua a ser tratada como hoje: é uma linha da lista e pode ser uma fatia, se estiver entre as maiores. Não se confunde com "Outras".
- **RN8** — Sem despesas no mês, **não há rosca**: fica o estado vazio que o bloco já tem ("Nenhuma despesa neste mês").

## Telas e estados

| Tela | Rota | Estados obrigatórios | Observações |
|---|---|---|---|
| Início | `/painel` | loading (skeleton) · vazio · erro · sucesso | A rosca entra dentro do bloco "Gastos por categoria", acima da lista. Os estados são os que o bloco já tem; o skeleton passa a reservar o espaço da rosca |
| Página inicial (vitrine) | `/` | — | Passa a usar o componente partilhado. **O que o visitante vê não muda** |

Em **375 px** a rosca fica centrada acima da lista. Nos dois temas, a fresta entre fatias usa a cor do fundo do cartão, não uma cor fixa.

Textos em **português do Brasil**, com acento.

## Critérios de aceite

- [x] **CA1** — Dado um mês com 3 categorias de despesa, quando abro o Início, então vejo uma rosca com 3 fatias, a contagem "3 categorias" no centro, e a lista completa por baixo.
- [x] **CA2** — Dado um mês com 9 categorias, quando abro o Início, então a rosca mostra **6 fatias** (as 5 maiores e "Outras"), o centro diz "9 categorias", e a lista por baixo mostra as **9** linhas.
- [x] **CA3** — Dado que a rosca tem a fatia "Outras", quando a lista é lida, então **não existe nenhuma linha "Outras"**; todas as linhas são categorias reais e clicáveis.
- [x] **CA4** — Dada uma categoria na rosca, quando comparo a cor da fatia com a cor da linha na lista, então são a mesma.
- [x] **CA5** — Dado um mês sem despesas, quando abro o Início, então não há rosca e vejo "Nenhuma despesa neste mês".
- [x] **CA6** — Dado o leitor de tela, quando percorre o bloco, então a rosca é ignorada e todos os valores são lidos a partir da lista.
- [x] **CA7** — Dada a página inicial pública, quando a comparo com antes da mudança, então o que o visitante vê continua igual.
- [x] **CA8** — Dado um mês com uma única categoria, quando abro o Início, então a rosca é um círculo cheio de uma cor e o centro diz "1 categoria", no singular.
- [x] **CA-a11y** — Funciona em 375 px, nos dois temas, e nenhuma informação depende só da cor.
- [x] **CA-build** — `npm run typecheck`, `npm run lint` e `npm run build` passam.

## Perguntas em aberto

Nenhuma. O corte em 5 + "Outras" (RN1) e a lista completa (RN2) foram decididos com o Pedro em 2026-11-02.

## Como o aceite foi feito

Em 2026-11-02, com o método da [LICOES](../../LICOES.md): cenário montado pela API no console do
navegador, verificação pela interface.

- **CA2 e CA8** precisaram de dados que nenhum mês tinha. Foram criadas **9 despesas de sonda** em
  novembro/2026 (mês vazio), com `SONDA spec 010` na descrição; depois apagadas até sobrar uma, e
  por fim todas. Novembro voltou a zero e outubro ficou intacto (R$ 837,00 em 3 categorias).
- Com 9 categorias, o gradiente tinha **6 fatias** — 5 cores de categoria e `var(--muted-foreground)`
  para "Outras" — e a lista mostrava as 9 linhas, nenhuma chamada "Outras".
- Com 1 categoria, o centro dizia **"1 categoria"** e a rosca era um círculo cheio.
- **CA6** foi conferido no DOM (`closest('[aria-hidden="true"]')`), não só pela árvore de
  acessibilidade da ferramenta, que mostra elementos escondidos.
- **CA7** foi conferido no Chrome, sem sessão, comparando com a referência do Pedro.
