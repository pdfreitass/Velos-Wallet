---
name: Velos Wallet
description: Seu dinheiro na direção certa.
colors:
  off-white: "#F4F7F2"
  page-light: "#ECF1EA"
  deep-green: "#0A2E24"
  vivid-green: "#2ED38C"
  card-white: "#F5F8F3"
  sage-mist: "#E1E8E1"
  sage-ink: "#576E66"
  border-sage: "#CDD6CF"
  field-sage: "#738880"
  money-green: "#197A50"
  expense-red: "#C1393E"
  dark-card: "#1A3C32"
  dark-muted: "#26463D"
  dark-ink: "#A9B7B0"
  dark-border: "#345249"
  dark-field: "#5C7A70"
  dark-expense-red: "#E96368"
  phone-graphite: "#1b2220"
  phone-edge: "#3a4643"
typography:
  display:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, min(5.2vw, 8.2svh), 4.5rem)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 4.2vw, 3.75rem)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  headline-step:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 3.4vw, 3rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  lead:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.55
  body:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1
  money:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
    fontFeature: "\"tnum\" 1"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  2xl: "18px"
  full: "9999px"
spacing:
  gutter-mobile: "16px"
  gutter-tablet: "32px"
  gutter-desktop: "80px"
  card-pad: "16px"
  card-pad-lg: "20px"
  section-y: "80px"
  section-y-lg: "112px"
  container-max: "90rem"
components:
  button-primary:
    backgroundColor: "{colors.deep-green}"
    textColor: "{colors.off-white}"
    rounded: "{rounded.lg}"
    padding: "0 28px"
    height: "52px"
  button-primary-dark:
    backgroundColor: "{colors.vivid-green}"
    textColor: "{colors.deep-green}"
    rounded: "{rounded.lg}"
    padding: "0 28px"
    height: "52px"
  button-outline:
    backgroundColor: "{colors.off-white}"
    textColor: "{colors.deep-green}"
    rounded: "{rounded.lg}"
    padding: "0 28px"
    height: "52px"
  button-form:
    backgroundColor: "{colors.deep-green}"
    textColor: "{colors.off-white}"
    rounded: "{rounded.lg}"
    height: "44px"
    width: "100%"
  input-field:
    backgroundColor: "transparent"
    textColor: "{colors.deep-green}"
    rounded: "{rounded.lg}"
    padding: "4px 10px"
    height: "44px"
  account-card:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.deep-green}"
    rounded: "{rounded.2xl}"
    padding: "{spacing.card-pad}"
  account-card-debt:
    backgroundColor: "{colors.deep-green}"
    textColor: "{colors.off-white}"
    rounded: "{rounded.2xl}"
    padding: "{spacing.card-pad}"
  chip-example:
    backgroundColor: "{colors.sage-mist}"
    textColor: "{colors.deep-green}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "2px 8px"
  icon-tile:
    backgroundColor: "{colors.sage-mist}"
    textColor: "{colors.deep-green}"
    rounded: "{rounded.lg}"
    size: "36px"
---

# Design System: Velos Wallet

## Overview

**Creative North Star: "Tudo converge"**

O Velos é um mundo de dois verdes e um papel claro. O verde profundo é a marca e a tinta; o off-white é o papel; o verde vivo aparece em poucos pontos, sempre como sinal de dinheiro ou de "isto está ligado agora". O motivo visual que o build carrega é a convergência: pedaços de dinheiro espalhados (cartões de conta brancos, levemente inclinados) ligados por fios tracejados a um único iPhone desenhado em CSS, onde viram um saldo só. A interface é direta, de densidade média, com títulos grandes e apertados em Geist e números sempre tabulares.

Claro e escuro são inversões exatas da mesma identidade, como as duas versões do logo. Uma área marcada como `.theme-inverse` usa sempre o tema oposto ao da página: o painel da marca nas telas de entrada, a faixa "Privado por padrão" e o cartão de crédito. É assim que o sistema cria ritmo de cor sem inventar cores novas. Profundidade vem de sombras suaves tingidas de verde, nunca de sombras duras ou gradientes decorativos.

A acessibilidade é parte da identidade, não um acabamento: todo par texto/fundo é medido (≥ 4,5:1, registrado em comentário no `globals.css`), borda de campo ≥ 3:1, e dinheiro nunca depende só da cor.

**Key Characteristics:**
- Dois temas que são a mesma paleta invertida, mais o escopo `.theme-inverse`.
- Verde vivo raro e com função (marca, fio ativo, dinheiro no escuro, primário no escuro).
- Títulos Geist 600 com tracking negativo forte; números tabulares em todo valor.
- Cartões brancos de borda fina e sombra suave tingida de verde; o cartão de dívida em tema invertido.
- Fios tracejados neutros que se acendem em verde vivo; iPhone grafite em CSS como vitrine do app.
- A tela do iPhone usa sempre o tema oposto ao da página (`.theme-inverse`): verde profundo na página clara, off-white na escura. Dentro de uma área já invertida, volta ao tema da página (`.theme-base`).
- Tema padrão: verde escuro para quem ainda não escolheu (ADR 0016). No tema claro o fundo da página é `#ECF1EA` (page-light), um passo abaixo do off-white da marca, e os cartões `#F5F8F3`: nunca branco puro. O off-white `#F4F7F2` segue como texto sobre o verde e nas peças da marca.
- Movimento com uma única curva (ease-out exponencial), visível por padrão e desligado com "reduzir movimento".

## Colors

Uma paleta quase monocromática em verde, com um acento vivo e um vermelho de despesa; o resto é neutro esverdeado.

### Primary
- **Verde Profundo** (deep-green): a marca. Texto e botão principal no tema claro, fundo da página no tema escuro, fundo das áreas `.theme-inverse` na página clara. 13,60:1 com o off-white nos dois sentidos.

### Secondary
- **Verde Vivo** (vivid-green): acento e dinheiro. Haste direita da marca (sempre, nos dois temas), contorno e fio da conta destacada, porta do fio ativo, seleção de texto (35% em mistura), botão principal e anel de foco **só no tema escuro**, valor de receita no escuro. Sobre ele, texto sempre em verde profundo (7,57:1).

### Tertiary
- **Verde Dinheiro** (money-green): a versão escurecida do verde vivo para o tema claro, onde o verde vivo reprova (1,80:1). É a receita (`income`), o anel de foco e o cursor dos campos no claro (4,61:1).
- **Vermelho Despesa** (expense-red / dark-expense-red): despesa e erro (`expense`, `destructive`), 4,51:1 em cada tema. Sempre acompanhado de sinal "-" e/ou seta.

### Neutral
- **Off-White** (off-white): fundo da página no claro; texto no escuro.
- **Branco Cartão** (card-white): cartões, popovers e a superfície do app no claro.
- **Névoa Sálvia** (sage-mist): `secondary`/`muted`; ladrilhos de ícone, chip "Exemplo", trilho de progresso.
- **Tinta Sálvia** (sage-ink): texto secundário no claro (4,53:1, no limite: não clarear).
- **Borda Sálvia** (border-sage): divisores decorativos, sem exigência de contraste.
- **Sálvia de Campo** (field-sage): borda de campo e de botão outline, fio tracejado em repouso (3,06:1).
- **Escuro**: dark-card (cartão), dark-muted (muted), dark-ink (texto secundário, 7,06:1), dark-border (divisor), dark-field (borda de campo, 3,13:1).
- **Grafite do Aparelho** (phone-graphite, phone-edge): exclusivos do iPhone em CSS e do dispositivo da vitrine.

### Named Rules
**The Two Greens Rule.** O verde profundo é a marca; o verde vivo é dinheiro e acento. No tema claro o verde vivo nunca é botão principal, texto nem anel de foco: ali ele só aparece como haste da marca, contorno, fio, porta ou preenchimento de progresso no escuro.

**The Money Token Rule.** Cor de dinheiro só pelos tokens `income` e `expense`, e nunca sozinha: todo valor leva sinal `+`/`-`, seta ou ícone. Paletas soltas (emerald, red) não existem neste sistema.

**The Measured Pair Rule.** Todo token de texto vem com o contraste medido em comentário no `globals.css`. Mexeu num token, remediu. Destaque de estado muda contorno e sombra, nunca o fundo, para os pares medidos continuarem válidos.

**The Inverse Scope Rule.** Para mudar o ritmo de cor, use `.theme-inverse` (o tema oposto, com os mesmos pares já medidos) em vez de criar uma cor de faixa nova.

## Typography

**Display Font:** Geist Variable (com ui-sans-serif, system-ui)
**Body Font:** Geist Variable
**Label/Mono Font:** Geist para rótulos; ui-monospace só como pilha de reserva, sem uso visível

**Character:** Uma única família geométrica e neutra, usada em dois registros: títulos grandes, pesados e apertados que soam firmes, e um corpo calmo em cinza-sálvia. Os números são o terceiro registro: sempre tabulares, 600, com tracking levemente negativo.

### Hierarchy
- **Display** (600, clamp até 4,5rem, 1,02, -0,035em): a frase da primeira dobra; `text-balance`.
- **Headline** (600, clamp até 3,75rem, 1,02, -0,035em): títulos de seção de peso (faixa de privacidade, fechamento) e a frase do painel da marca (até 3,25rem).
- **Headline Step** (600, clamp até 3rem, 1,05, -0,03em): títulos das seções da história.
- **Title** (600, 1,875rem, tracking-tight): título das telas de formulário ("Entrar").
- **Lead** (400, 1,125rem a 1,25rem, cor `muted-foreground`): subtítulos sob os títulos, largura máxima de 28 a 34rem, `text-pretty`.
- **Body** (400, 1rem; 0,875rem em cartões e listas): texto corrido.
- **Label** (500, 0,875rem, leading 1): rótulos de campo, botões, abas (0,75rem).
- **Money** (600, tabular, -0,025em; 1,125rem a 1,5rem nos cartões, 1,875rem no saldo do aparelho).

### Named Rules
**The Tabular Rule.** Todo valor em reais e toda porcentagem usa números tabulares, para dígitos não dançarem quando o valor troca.

**The Sentence Case Rule.** Nada em caixa alta nem com tracking positivo: rótulos e títulos em caixa de frase, como no build.

## Layout

Mobile-first a partir de 375 px. Contêiner máximo de 90rem centralizado, com margens laterais de 16 px (celular), 32 px (≥ 640 px) e 80 px (≥ 1024 px). Seções respiram com 80 px verticais no celular e 112 a 128 px no desktop; as seções da história ocupam no mínimo 78svh no desktop.

O desktop usa duas colunas assimétricas em proporções de fração (5fr/6fr no layout de entrada e na faixa de privacidade; 1fr/1,15fr no fechamento). Na página inicial o texto rola à esquerda enquanto o iPhone fica fixo (sticky) à direita, centrado na altura útil abaixo do cabeçalho de 4,5rem, e troca de tela conforme a seção. No celular, colunas viram pilha: os quatro cartões de conta em grade 2×2 acima do aparelho, botões de largura total, e uma barra fixa no rodapé com "Criar conta grátis" depois que os botões da primeira dobra saem da tela.

Formulários ficam numa coluna de no máximo 24rem (`max-w-sm`), com 24 px entre blocos e 20 px entre campos. Dentro do aparelho, a escala do Tailwind é redefinida em proporção à largura do iPhone (1 unidade = largura/80), para que espaçamento, raio e texto escalem juntos.

## Elevation & Depth

Sistema híbrido: superfícies planas por padrão (botões, campos, linhas), e sombras suaves, longas e tingidas de verde-quase-preto (rgb 4 20 15) só em objetos que "flutuam" no palco: cartões de conta, cartões ilustrativos, a janela de navegador, o iPhone e a barra fixa do celular. Não há sombras duras, deslocadas ou coloridas.

### Shadow Vocabulary
- **Cartão flutuante** (`0 14px 30px -14px rgb(4 20 15 / 0.35)`; 0,45 no cartão invertido): repouso dos cartões de conta e ilustrativos.
- **Cartão destacado** (`0 20px 40px -16px rgb(4 20 15 / 0.45)`): conta com mouse ou foco, junto com borda em verde vivo.
- **Aparelho** (`inset 0 0 0 1.8px #3a4643, 0 2px 6px rgb(4 20 15 / 0.2), 0 32px 64px -20px rgb(4 20 15 / 0.45)`): o iPhone em CSS.
- **Janela** (`0 30px 60px -24px rgb(4 20 15 / 0.4)`): a janela de navegador do fechamento.
- **Barra inferior** (`0 -10px 30px -18px rgb(4 20 15 / 0.35)`): a barra fixa de CTA no celular.
- **Linha ativa** (`0 0 0 1.5px var(--accent), 0 4px 12px -6px rgb(4 20 15 / 0.3)`): conta destacada dentro do aparelho.

### Named Rules
**The Floating Objects Rule.** Só o que está "no palco" ganha sombra. Controles e superfícies de leitura ficam planos; o cartão da shadcn usa um anel de 1 px (foreground a 10%) em vez de sombra.

## Shapes

Cantos suavemente arredondados a partir de um raio base de 10 px (`--radius: 0.625rem`), com uma escala derivada (6, 8, 10, 14, 18 px). Botões, campos, linhas e ladrilhos de ícone usam 10 px; cartões de conta e janelas, 18 px; chips e focos de link, 8 px; pontos, portas de fio, barras de progresso e a pílula do aparelho são totalmente redondos. Bordas são finas (1 px; 1,5 px em fios e portas). O iPhone tem silhueta própria: proporção 1:2,05, raio de 16,5% da largura, tela com raio de 13% e ilha dinâmica em pílula.

Os cartões de conta e os cartões ilustrativos ficam levemente inclinados (de -4° a 3°, metade disso no celular) e se deslocam alguns pixels com o mouse; nada mais na interface é girado.

## Components

### Buttons
Firmes e quietos: cor sólida, sem sombra, um leve afundar de 1 px ao clicar.
- **Shape:** cantos de 10 px.
- **Primary:** fundo `primary` (verde profundo no claro, verde vivo no escuro) com texto `primary-foreground`. Altura de 52 px e 28 px laterais nas chamadas da página; 44 px e largura total nos formulários; 48 px na barra inferior do celular; 40 px no cabeçalho.
- **Hover / Focus:** hover reduz o fundo a 80%; foco com borda `ring` e anel de 3 px em `ring` a 50%. Desabilitado a 50% de opacidade.
- **Outline:** fundo da página, borda `input` (sálvia de campo, ≥ 3:1) nas chamadas; hover em `muted`.
- **Ghost / Link:** ghost com hover em `muted`; links de texto em `foreground` sublinhados (deslocamento 0,2em, 1 px), hover em `primary`.

### Chips
- **Style:** o selo "Exemplo" dentro do aparelho: fundo `muted`, texto 0,75rem 500, cantos de 8 px, 2 × 8 px de respiro. Sinaliza que os valores são ilustrativos.

### Cards / Containers
- **Corner Style:** 18 px nos cartões de conta e ilustrativos; 14 px no cartão genérico.
- **Background:** `card` (branco no claro, #1A3C32 no escuro); o cartão de crédito usa `.theme-inverse` com o valor em `expense` e sinal "-".
- **Shadow Strategy:** ver "Cartão flutuante" e "Cartão destacado".
- **Border:** 1 px `border`; no destaque, `accent`.
- **Internal Padding:** 16 px (20 px no desktop).

### Inputs / Fields
- **Style:** fundo transparente (input a 30% no escuro), borda 1 px `input`, cantos de 10 px, altura de 44 px e texto de 1rem nos formulários.
- **Focus:** borda `ring` + anel de 3 px em `ring` a 50%; cursor em `ring`.
- **Error / Disabled:** `aria-invalid` troca a borda para `destructive` com anel a 20%; mensagem em `destructive` abaixo do campo, ligada por `aria-describedby`. Erro do formulário inteiro num alerta com borda `destructive` a 40%, fundo a 8% e ícone. Desabilitado a 50%.

### Navigation
- **Cabeçalho:** fixo no topo, fundo da página, borda inferior que só aparece depois de rolar 8 px. Marca (símbolo + "Velos Wallet" 600) à esquerda; tema, Entrar (outline) e Criar conta (primário, oculto no celular) à direita. 64 px de altura, 72 px no desktop.
- **Abas do aparelho:** quatro abas com ícone de 20 px e rótulo de 0,75rem 500, alvo mínimo de 44 px; a ativa em `foreground` com um traço de 2 px no topo, as outras em `muted-foreground`. Padrão de abas do WAI-ARIA (setas, Home, End).

### Vitrine do App (componente de assinatura)
Um iPhone grafite desenhado em CSS (moldura #1b2220, borda #3a4643, botões laterais, ilha dinâmica) que mostra o app de exemplo com texto real: rótulo, saldo em `Ticker` (cada dígito rola para o lugar ao trocar), selo "Exemplo", a tela ativa e as abas. Tamanhos: hero (até 320 px), compact (painel de entrada), peek (só o topo, com máscara de esmaecimento, nas seções do celular) e mini (sobre a janela de navegador).

### Fios de convergência (componente de assinatura)
Fios SVG ligam cada conta ao aparelho: tracejado 4/6, 1,5 px, em `input` no repouso; ao destacar uma conta, o fio dela se desenha em `accent` com 2 px e a porta se preenche de verde vivo. Na abertura, um pulso percorre cada fio uma vez, escalonado em 140 ms.

### Movimento
Uma curva só (`cubic-bezier(0.16, 1, 0.3, 1)`) para entradas: linhas do saldo que "se somam" (700 ms, 120 ms entre linhas), dígitos do ticker (560 ms, 22 ms entre dígitos), troca de tela (480 ms, deslize de 8% com desfoque). Todo conteúdo é visível sem animação; as animações só existem sob `prefers-reduced-motion: no-preference`, e a inclinação com o mouse só com ponteiro fino.

## Do's and Don'ts

### Do:
- **Do** use verde profundo como botão principal e texto no claro, e deixe o tema escuro inverter para verde vivo com texto em verde profundo.
- **Do** mostre dinheiro com `text-income` / `text-expense`, número tabular e sinal `+`/`-` ou seta, sempre.
- **Do** meça e registre no `globals.css` o contraste de todo par novo (≥ 4,5:1 para texto, ≥ 3:1 para borda de controle).
- **Do** use `.theme-inverse` para faixas e painéis de contraste em vez de cores novas.
- **Do** destaque estado com contorno em `accent` e sombra, mantendo o fundo original.
- **Do** dê a toda lista estados de carregamento (skeleton), vazio e erro, e alvos de toque de 44 px.
- **Do** use ícones lucide de traço único, no tom do texto.

### Don't:
- **Don't** use verde vivo como botão principal, texto ou anel de foco no tema claro (1,80:1 sobre o off-white).
- **Don't** use paletas soltas do Tailwind (`emerald`, `red`, `green`) para dinheiro ou estado.
- **Don't** dependa só da cor para receita, despesa, dívida ou validação.
- **Don't** use caixa alta, tracking positivo ou rótulos-kicker acima dos títulos.
- **Don't** dê sombra a botões, campos ou linhas; sombra é só para objetos flutuantes no palco.
- **Don't** anime sem a guarda de "reduzir movimento" nem esconda conteúdo até a animação rodar.
