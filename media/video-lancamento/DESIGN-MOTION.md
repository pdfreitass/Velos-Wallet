# DESIGN.md para o Motion — Velos Wallet

Conteúdo a passar em `design_md` no `create_video`. Extraído de
`web/src/styles/globals.css`, `CLAUDE.md` e `PRODUCT.md` — nenhuma cor foi inventada.

## Marca

Velos Wallet, gestão financeira pessoal no Brasil.
Frase da marca: **"Seu dinheiro na direção certa."**
Voz: próxima e direta — "você", frases curtas, sem jargão de banco e sem gíria.

## Cores

| Papel | Hex | Uso no vídeo |
|---|---|---|
| Verde profundo (marca) | `#0A2E24` | Fundo dominante, abertura e fechamento |
| Off-white | `#F4F7F2` | Texto sobre o verde profundo |
| Fundo claro | `#ECF1EA` | Cenas claras (login, seção de privacidade) |
| Verde vivo (acento) | `#2ED38C` | Botão principal no escuro, destaques, linha de fluxo |
| Receita | `#197A50` (claro) / `#2ED38C` (escuro) | Valores positivos |
| Despesa | `#C1393E` | Valores negativos |
| Superfície de cartão | `#1A3C32` (escuro) / `#F5F8F3` (claro) | Cartões e tela do aparelho |
| Texto secundário | `#A9B7B0` (escuro) / `#576E66` (claro) | Rótulos |
| Categorias do gráfico | `#4F8DF7` `#E8833A` `#7C5CF5` `#D94FA8` `#6B8075` | Rosca de gastos |

**Regras obrigatórias da identidade:**
1. O verde **profundo** é a marca; o verde **vivo** é dinheiro e acento.
2. O verde vivo nunca é botão principal sobre fundo claro (reprova em contraste).
3. Cor de dinheiro só pelos tokens de receita e despesa.
4. Nunca depender só da cor: todo valor leva sinal `+`/`−` e/ou ícone.
5. Branco puro (`#FFFFFF`) não existe na paleta — "estoura" ao lado do verde.

## Tipografia

**Geist Variable** em tudo. Títulos com peso semibold e `tracking-tight`, bem grandes e
apertados, como no hero da página. Corpo em regular. Valores em dinheiro sempre no formato
brasileiro: `R$ 10.650,45` (ponto no milhar, vírgula no decimal).

## Forma e movimento

- Cantos arredondados generosos (raio base 10 px, até ~26 px nos cartões grandes).
- Cartões com um degrau de luminosidade acima do fundo, nunca com sombra pesada.
- Linhas finas tracejadas que conduzem o olho até o aparelho: é a assinatura visual da página
  inicial e deve aparecer no vídeo.
- Movimento calmo e contínuo, com aceleração suave. Nada de salto, giro ou piscada.
- O aparelho é um iPhone de moldura escura; a tela dentro dele usa o tema **oposto** ao do fundo
  (tela clara sobre página escura), como na aplicação real.

## Acessibilidade

Todo par de texto e fundo passa de 4,5:1 nos dois temas. Texto na tela grande o bastante para
ler no celular. Essa é uma promessa do produto, não um detalhe.

## Proibido

Pessoas sorrindo em stock footage, moedas e cifrões em 3D, gráficos genéricos de bolsa, seta
subindo, cofrinho em render, qualquer número de usuários ou depoimento. O produto ainda não tem
tração e não pode sugerir que tem.
