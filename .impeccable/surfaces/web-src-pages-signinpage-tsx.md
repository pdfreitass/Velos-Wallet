---
version: 1
slug: "web-src-pages-signinpage-tsx"
primary_target: "web/src/pages/SignInPage.tsx"
related_targets: ["web/src/pages/SignUpPage.tsx"]
---

# Entrar e Criar conta (/entrar, /cadastro)

Escopo: telas de entrada do app (spec 001). Modo **Operate**: a pessoa vem fazer uma tarefa (entrar ou criar a conta). Construção code-led. Mundo visual **herdado** da identidade Velos já existente no código (tokens em web/src/styles/globals.css, regras do CLAUDE.md); nenhuma identidade nova.

Público e tarefa: pessoa física no Brasil, 18–35 anos, quase sempre no celular. Precisa entrar ou criar a conta em segundos, entendendo antes do cadastro o que ganha. Prova disponível: só o próprio mecanismo do produto (nenhum depoimento ou número de uso existe; nada inventado).

Decisões do Pedro: voz próxima e direta; no desktop, formulário + painel da marca; no celular, só o formulário com a marca no topo.

## Direction contract

THESIS: entrar no Velos é entrar no próprio dinheiro. A tela demonstra o mecanismo (contas diferentes somando num saldo só) ao lado de um formulário direto, em vez do card flutuante num fundo neutro e da ilustração genérica de fintech.

OWN-WORLD: painel em verde profundo #0A2E24 ocupando a metade esquerda inteira (cor comprometida, não acento); off-white #F4F7F2 no texto do painel e no fundo do formulário no tema claro; verde vivo #2ED38C só na haste direita da marca e em dinheiro; marca redesenhada em SVG a partir do PNG; Geist; fios off-white a 14%; números tabulares; ícones lucide de traço único; campos e botões de 44 px do shadcn/Base UI.

STORY: em segundos a pessoa reconhece o app (marca e frase), vê o que ganha (tudo num lugar só, privado, sem loja de apps) e entra ou cria a conta sem atrito; todo erro diz o problema e a saída.

FIRST VIEWPORT: 1440 px: grid 5/6. Esquerda, painel verde profundo de altura total: marca + "Velos Wallet" no topo; "Seu dinheiro na direção certa." como título de exibição; bloco "Tudo num lugar só" com três contas, o saldo total e o cartão à parte (exemplo rotulado); duas linhas de valor com ícone. Direita: alternância de tema no canto superior; título "Entrar" com subtítulo, email, senha com mostrar/ocultar e "Esqueci minha senha", botão principal de largura total, divisor "ou", Google, link para criar conta. 375 px: marca no topo e formulário; ação principal acima da dobra.

FORM: extensão de mundo estabelecido para um pedido especificado (spec 001: campos, estados e rotas definidos); sem rodada de conceitos e sem seed. Base: reference/new-work.md, seção 3, "Create a whole surface inside an established world": "Never run the script for a local extension or a precisely specified narrow request; shape those directly." A única escolha de composição em aberto (desktop com painel da marca ou formulário centralizado) foi decidida pelo usuário no questionário. Assinatura: o bloco de contas "se soma" uma vez (linhas em sequência, o fio do total se desenha, o saldo aparece por último), ease-out exponencial, desligado com prefers-reduced-motion.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Em aberto

- Botão do Google aparece agora, mas o endpoint chega na T20.
- "Esqueci minha senha" leva a /recuperar-senha, que chega na T19.
