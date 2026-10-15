# Vídeo de lançamento — Velos Wallet

Roteiro para o template `motion-app-launch` (engine `motion`, 25,77 s, 1920×1080).
Materiais: as capturas desta pasta. Nada aqui foi inventado: todo número na tela sai de
`web/src/features/showcase/showcase-data.ts`, que o próprio app rotula como **Exemplo**.

## Estrutura do template

O `motion-app-launch` tem quatro momentos fixos: apresentação do produto → toque no ícone →
revelação de **cinco telas** → logo e chamada final. O roteiro abaixo encaixa o Velos nesses
blocos.

| # | Tempo | Duração | O que se vê | Texto na tela | Referência |
|---|---|---|---|---|---|
| 1 | 0,0–4,0 s | 4,0 s | Fundo verde profundo (#0A2E24). O símbolo V entra e o texto se assenta. Câmera quase parada, só um respiro de escala. | **Seu dinheiro na direção certa.** | `01-home-hero-escuro.png` |
| 2 | 4,0–6,0 s | 2,0 s | O ícone do app é tocado e abre: corte para o aparelho da página inicial, ainda sem conteúdo. | *(sem texto)* | `03-home-app-contas-16x9-escuro.png` |
| 3 | 6,0–9,2 s | 3,2 s | **Tela 1 — Contas.** Os cartões soltos (conta corrente, poupança, dinheiro, cartão) viajam pelas linhas e viram um saldo único: R$ 10.650,45. | **Todas as contas num lugar só** | `02-app-contas-escuro.png` + `03-home-app-contas-16x9-escuro.png` |
| 4 | 9,2–12,4 s | 3,2 s | **Tela 2 — Mês.** Entradas × saídas e o que sobrou: +R$ 1.581,60. A barra cresce da esquerda. | **Quanto entrou, quanto saiu** | `04-app-mes-escuro.png` |
| 5 | 12,4–15,6 s | 3,2 s | **Tela 3 — Gastos.** A rosca de 5 categorias se desenha e a lista aparece linha a linha (Moradia 55%, Alimentação 23%…). | **Para onde o dinheiro foi** | `06-app-gastos-escuro.png` |
| 6 | 15,6–18,8 s | 3,2 s | **Tela 4 — Metas.** Três barras de progresso enchem em sequência: Salvador 62%, Reserva 21%, Notebook 20%. | **E quanto falta para a sua meta** | `08-app-metas-escuro.png` |
| 7 | 18,8–22,0 s | 3,2 s | **Tela 5 — Entrar.** O split-screen do login: marca à esquerda, formulário à direita. Mostra que é privado e que abre no navegador. | **Sem loja de apps. Privado por padrão.** | `12-entrar-16x9-escuro.png` |
| 8 | 22,0–25,8 s | 3,8 s | Fecha no verde profundo. O V desenha-se, o logotipo completo assenta e entra a chamada. | **Velos Wallet** · *Crie sua conta grátis* | `01-home-hero-escuro.png` (cor) + `web/public/brand/velos-escuro.png` |

Total: **25,8 s**, o comprimento nativo do template.

## Direção

- **Tom:** fintech premium, sóbria. Sem locução; música discreta e sons curtos nas transições.
- **Movimento:** cortes suaves com continuidade — a tela do aparelho desliza lateralmente entre
  as telas 1→4, como no app de verdade. Nada pisca nem gira.
- **Enquadramento:** o aparelho ocupa o terço direito nas cenas 3–6, com o texto respirando à
  esquerda, igual à composição real da página inicial.
- **Texto:** no máximo 5 palavras por cartela, português do Brasil, sempre em Geist.
- **Números:** contam para cima (o app já faz isso na cena de contas). Receita com `+` e verde,
  despesa com `−` e vermelho — nunca só pela cor.
- **Selo "Exemplo":** aparece nas capturas e deve continuar visível. Os valores são ilustrativos
  e o produto ainda não tem usuários.

## O que o vídeo NÃO pode afirmar

Checado contra `PRODUCT.md` → *Evidence on Hand*: não existem usuários, depoimentos, avaliações,
clientes nem imprensa. Nada de "milhares de pessoas já usam", nota em loja ou logotipo de
parceiro. O MVP está em construção; o vídeo mostra o produto, não tração.
