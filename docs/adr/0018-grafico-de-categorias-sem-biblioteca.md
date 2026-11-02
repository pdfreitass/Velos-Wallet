# ADR 0018 — Gráfico de gastos por categoria sem biblioteca

- **Status:** Aceita · desenho revisto pelo [ADR 0019](0019-rosca-de-categorias-em-css.md) (rosca em CSS, 2026-11-02). A parte central — **nenhuma biblioteca de gráfico no MVP** — continua de pé
- **Data:** 2026-10-17
- **Contexto da decisão:** spec 005 (Dashboard), P1

## Contexto

A stack listava o **Recharts** como "planejado" para o gráfico por categoria do dashboard. Na hora de implementar, o único gráfico do MVP é "quanto gastei em cada categoria no mês": uma lista de 5 a 15 valores, comparados entre si.

## Decisão

Mostrar os gastos por categoria em **barras horizontais feitas em HTML/CSS** (uma linha por categoria: ícone e nome, valor, porcentagem e uma barra com a largura proporcional ao total). **Não instalar o Recharts** no MVP.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Rosca/pizza com Recharts | Ângulos são difíceis de comparar quando as fatias são parecidas; o nome e o valor ficam numa legenda à parte; SVG exige trabalho extra para o leitor de tela; ~100 KB a mais no pacote da tela |
| Barras com Recharts | Resolve a comparação, mas a lib só desenharia retângulos que o CSS já desenha, com o mesmo custo de pacote e de acessibilidade |

## Consequências

- Nenhuma dependência nova; a tela do Início continua leve.
- Nome, valor e porcentagem são **texto de verdade**: leitor de tela, zoom e tradução automática funcionam sem esforço.
- A cor de cada barra vem da paleta das categorias (contraste já medido no `globals.css`), e a barra nunca é a única informação.
- Se um gráfico de evolução no tempo (linha) entrar depois do MVP, reavaliar uma biblioteca nesse momento.
