# ADR 0019 — Rosca de categorias em CSS, partilhada com a vitrine

- **Status:** Aceita
- **Data:** 2026-11-02
- **Etapa:** Etapa 6 — Dashboard (revisão)

## Contexto

O [ADR 0018](0018-grafico-de-categorias-sem-biblioteca.md) decidiu mostrar os gastos por categoria em **barras horizontais** e não instalar o Recharts. A decisão está implementada em `CategorySpending.tsx` e funciona.

Só que a **vitrine da página inicial** desenha a mesma informação de outra forma: uma **rosca em `conic-gradient`** com a contagem de categorias no centro, e a lista com nome, valor e porcentagem por baixo (`showcase/screens/CategoriesScreen.tsx`). É o que um visitante vê antes de criar conta.

Em 2026-11-02 o Pedro abriu o Início, não reconheceu o bloco e disse que "o dashboard não está ali" — mandou como referência exatamente a tela da vitrine. **Se o dono do produto estranha, um usuário novo também estranha:** a página inicial promete um desenho, e o app entrega outro.

Ao reler o ADR 0018, três dos seus quatro argumentos eram contra **rosca feita com biblioteca**, não contra rosca:

| Argumento do ADR 0018 | Vale para a rosca em CSS? |
|---|---|
| Recharts custa ~100 KB no pacote da tela | **Não** — `conic-gradient` é CSS, zero KB |
| SVG exige trabalho extra para o leitor de tela | **Não** — a rosca é `aria-hidden`; quem informa é a lista |
| Nome e valor ficariam numa legenda à parte | **Não** — a lista por baixo mantém nome, valor e porcentagem como texto |
| Ângulos são difíceis de comparar entre fatias parecidas | **Sim**, continua válido |

O quarto argumento é real, e é por isso que a rosca **não substitui** a lista: ela resume, a lista informa.

## Decisão

Mostrar os gastos por categoria do Início com uma **rosca em `conic-gradient`** acima da lista, usando **o mesmo componente da vitrine** e **sem nenhuma dependência nova**. A lista por baixo continua a ser a fonte de informação, com nome, valor, porcentagem e o link para as transações da categoria.

Como a rosca perde sentido com muitas fatias, ela mostra **no máximo 6 fatias**: as 5 maiores categorias e uma fatia **"Outras"** com a soma do resto. **A lista por baixo continua completa**, categoria a categoria.

Isto **revê o ADR 0018 na parte do desenho** e **mantém** a sua parte central: nenhuma biblioteca de gráfico no MVP.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Manter as barras e mudar a vitrine para barras | A vitrine é o material de marketing e a rosca comunica melhor "para onde vai o dinheiro" num relance; e o Pedro quer a rosca no app |
| Rosca com todas as fatias, sem agrupar | Com 10–15 categorias viram fatias de 1% indistinguíveis; a cor deixa de significar e o gráfico vira ruído |
| Rosca com Recharts | O ADR 0018 continua certo nisto: a biblioteca só desenharia o que o CSS já desenha, com custo de pacote e de acessibilidade |
| Rosca em vez da lista | Reintroduziria o argumento 4 do ADR 0018 sem resposta: ângulos parecidos não se comparam |

## Consequências

- **Positivas:** a página inicial e o app passam a mostrar a mesma coisa; um componente só, em vez de dois desenhos a manter; nenhuma dependência nova; a informação continua em texto.
- **Negativas / riscos aceitos:** a rosca agrupada mostra "Outras" como uma fatia que não existe como categoria — por isso ela **não é clicável** e a lista por baixo nunca agrupa; o `conic-gradient` exige uma fresta da cor do fundo entre fatias para elas se distinguirem, o que é um detalhe a manter ao mexer no tema.
- **O que passa a ser regra:** gráfico no MVP continua a ser **sem biblioteca**. Um gráfico de evolução no tempo (linha) reabre a conversa, como o ADR 0018 já previa.

## Quando revisitar

Se entrar um gráfico de evolução no tempo depois do MVP, ou se o número de categorias por usuário crescer ao ponto de 5 + "Outras" esconder informação útil.
