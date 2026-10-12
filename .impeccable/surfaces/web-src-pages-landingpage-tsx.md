---
version: 1
slug: "web-src-pages-landingpage-tsx"
primary_target: "web/src/pages/LandingPage.tsx"
related_targets: []
---

# Página inicial (/)

Escopo: página pública de apresentação (spec 003). Modo **Persuade**: o visitante decide se cria conta. Construção code-led (sem geração de imagem). Mundo visual **herdado** da identidade Velos (tokens em web/src/styles/globals.css, regras do CLAUDE.md, PRODUCT.md). Composição escolhida pelo Pedro na página de decisão da Impeccable: **Tudo converge** (esboço em .impeccable/mocks/decision/tudo-converge.html).

Público e ação: pessoa física no Brasil, 18–35, quase sempre no celular, que controla o dinheiro de cabeça ou em planilha. Ação: Criar conta (ou Entrar). Prova: o próprio mecanismo do produto, com dados ilustrativos rotulados; nenhum número de uso, depoimento ou parceiro.

Decisões do Pedro: logado vai direto ao painel; só telas do app (sem fotos); primeira dobra + seções; mesmo iPhone, compacto, no painel das telas de entrada; sem lista de espera.

## Direction contract

THESIS: o dinheiro de hoje vive espalhado (banco, poupança, dinheiro vivo, cartão); a página mostra esses pedaços se ligando ao iPhone e virando um saldo só. Recusa o hero dividido com o aparelho flutuando sozinho e a fileira de cartões iguais de funcionalidades.

OWN-WORLD: fundo off-white #F4F7F2 (claro) ou verde profundo #0A2E24 (escuro); texto e botão principal em verde profundo no claro; verde vivo #2ED38C só na haste da marca, nos fios ativos e em dinheiro; cartões de conta brancos com borda fina e sombra suave, o do cartão de crédito em verde profundo com a dívida em vermelho e sinal "-"; fios tracejados em #7D928A; iPhone grafite desenhado em CSS; Geist; números tabulares; ícones lucide de traço único. Uma faixa em tema invertido para "Privado por padrão".

STORY: em segundos a pessoa entende que o Velos junta todas as contas num saldo que ela entende, mexe no exemplo (passa o mouse ou toca numa conta e vê ela no iPhone; troca as abas Contas, Mês, Gastos e Metas), rola e vê para onde vai o dinheiro e as metas, e cria a conta.

FIRST VIEWPORT: 1440 px: cabeçalho com marca, Entrar, Criar conta e tema; frase em ~72 px no alto à esquerda, subtítulo e os botões Criar conta grátis e Entrar; abaixo e à esquerda, quatro cartões de conta levemente inclinados; fios tracejados saem de cada cartão e convergem para o iPhone no centro-direita, que mostra Saldo total R$ 10.650,45 (Exemplo) com as abas embaixo. 375 px: cabeçalho compacto, frase, subtítulo e botões de largura total; os quatro cartões em grade 2×2 acima do iPhone, com fios descendo até ele.

FORM: estrutura "Tudo converge", 1ª da lista ordenada por ressonância, terceira carta da mão sorteada (posições 5, 6, 1); seed key c9769ee7; rodada de superfície em modo persuade. Assinatura: ao abrir, um pulso percorre cada fio até o iPhone e as linhas do saldo se somam (uma vez, ease-out exponencial, desligado com reduzir movimento). Interação: passar o mouse ou focar uma conta acende o fio dela e a linha correspondente no iPhone; o palco inclina de leve com o mouse (só ponteiro fino). Disciplina absorvida do contador nixie: valores trocam como dígitos em camadas ao mudar de tela.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Em aberto

- Os cartões flutuantes de salário, mercado e meta da spec aparecem nas seções (Mês e Metas), não na primeira dobra: na composição escolhida, os cartões da abertura são as contas.
