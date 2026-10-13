# Plano técnico — Spec 003: Página inicial

- **Status:** **Aprovado** (2026-10-12)
- **Spec:** [spec.md](spec.md) (Aprovada em 2026-10-12)

## Resumo da abordagem

A página inicial vive **dentro do SPA** (React + Vite), na rota pública `/`, servida pela mesma API em produção (ADR 0013). Tudo é **desenhado em código**: o iPhone, as telas do app e os cartões flutuantes são componentes React com os tokens do projeto. Por isso ficam nítidos, seguem o tema claro e escuro e respondem ao toque, sem imagens para baixar. Para a página abrir rápido no celular, as telas do app (entrar, cadastro e painel) passam a carregar **sob demanda**: quem abre `/` não baixa o código dos formulários.

Sem dependência nova.

## Componentes

### Vitrine do app (`web/src/features/showcase/`): compartilhada com o painel das telas de entrada

| Arquivo | Responsabilidade |
|---|---|
| `PhoneMockup.tsx` | Moldura do iPhone em CSS (bordas, ilha dinâmica, barra de status), tamanhos `hero` e `compact`, segue o tema |
| `screens/AccountsScreen.tsx` | Contas e saldo total; as contas "se somam" (a assinatura atual migra para cá) |
| `screens/MonthScreen.tsx` | Entradas × saídas do mês (barras) e últimas transações com sinal `+`/`-` e ícone |
| `screens/CategoriesScreen.tsx` | Gastos por categoria em barras (CSS, sem Recharts) com as cores de categoria do projeto |
| `screens/GoalsScreen.tsx` | Metas com barra de progresso e valor-alvo |
| `ScreenTabs.tsx` | Controle para trocar de tela: padrão de abas acessível (setas do teclado, `aria-selected`) |
| `showcase-data.ts` | Dados **ilustrativos** num lugar só, rotulados "Exemplo" (RN2); valores em centavos |
| `FloatingCards.tsx` | Cartões em volta do aparelho: salário entrando, despesa no mercado, meta a 62% |
| `useParallax.ts` | Profundidade ao mover o mouse: variáveis CSS, só com mouse (não no toque) e sem "reduzir movimento" |

### Página inicial (`web/src/features/landing/` + `web/src/pages/LandingPage.tsx`)

| Arquivo | Responsabilidade |
|---|---|
| `LandingHeader.tsx` | Marca, "Entrar", "Criar conta" e tema (no celular, só ícone no tema) |
| `Hero.tsx` | Primeira dobra: frase, subtítulo, botões, iPhone com abas e cartões flutuantes |
| `FeatureSections.tsx` | As 5 seções; no desktop, o iPhone fica fixo ao lado e troca de tela conforme a seção visível |
| `useActiveSection.ts` | Qual seção está na tela (IntersectionObserver), para o iPhone acompanhar |
| `MobileCtaBar.tsx` | Barra fixa com "Criar conta" no celular depois que a primeira dobra sai da tela (RN3) |
| `LandingFooter.tsx` | Marca, frase e Instagram @veloswallet |

Uma seção (proposta: "Privado por padrão") usa o escopo `.theme-inverse` já criado, para dar ritmo de cor à página sem tokens novos.

### Mudanças no que existe

| Arquivo | Mudança |
|---|---|
| `web/src/router.tsx` | `/` passa a ser a página inicial (pública); entrar, cadastro e painel em `lazy()` com `Suspense` |
| `web/src/features/auth/guards.tsx` | Sai o `RootRedirect`; entra a regra "logado em `/` vai para `/painel`" (RN1) |
| `web/src/features/auth/components/BrandPanel.tsx` | O bloco de contas dá lugar ao `PhoneMockup` compacto com as abas (decisão 4) |
| `web/src/features/auth/components/AccountsSumExample.tsx` | Removido: vira `AccountsScreen` |
| `web/src/styles/globals.css` | Animações da vitrine (troca de tela, entrada dos cartões), todas dentro de `prefers-reduced-motion: no-preference` |

## Comportamento de `/` (RN1)

A página aparece **na hora** para todos. Em paralelo, o `/api/me` responde: se houver sessão, vai para `/painel`. Assim o visitante, que é o público de `/`, nunca espera, e quem está logado vê a página por uma fração de segundo antes de ir ao painel.

## Movimento e interação

- **Uma assinatura** só: a troca de telas do iPhone (deslize curto com desfoque, ease-out exponencial). Os cartões entram uma vez, ao abrir.
- Profundidade com o mouse só no desktop, só com ponteiro fino e só sem "reduzir movimento".
- **Nada contínuo:** sem loop, sem carrossel automático. O iPhone só troca de tela por clique, toque, teclado ou rolagem.
- Com "reduzir movimento": tudo visível e parado (RN5).

## Desempenho (RN7 · CA-perf)

- Telas do app em `lazy()`: o Zod, o React Hook Form e os formulários saem do código inicial de `/`.
- Nenhuma imagem: só código e o SVG da marca. A fonte Geist já é servida pelo próprio app.
- Meta: Lighthouse no celular ≥ 90, conferida com o `npx lighthouse` (sem instalar no projeto).

## Acessibilidade (RN6)

- A troca de telas usa o padrão de abas do WAI-ARIA, com rótulos ("Contas", "Mês", "Gastos", "Metas").
- O conteúdo do iPhone é texto de verdade, dentro de uma região rotulada "Exemplo do app". Os cartões flutuantes repetem informação do aparelho e ficam ocultos para o leitor de tela.
- Contraste medido nos dois temas, inclusive no bloco invertido; foco visível em todo controle.

## Processo de design (Impeccable)

A página inicial é uma superfície de **persuasão** num mundo visual já estabelecido. Antes de construir, rodo a rodada de conceitos da Impeccable (`concept-seed --scope surface --mode persuade`): ela sorteia **3 composições diferentes da primeira dobra** e mostra numa **página local** para você escolher. O sorteio consulta o servidor da Impeccable (sem telemetria). A construção é feita direto em código, sem imagem gerada. No fim: detector, revisor de acabamento independente e documentação do design system (`DESIGN.md`).

## Riscos

- **iPhone desenhado em código** pode parecer "de brinquedo" se a moldura for simples demais. Por isso a escolha entre as 3 composições e a revisão independente no fim.
- **Seção fixa (iPhone acompanhando a rolagem)** é frágil em telas baixas. No celular, cada seção mostra a própria tela em vez do aparelho fixo.
- **Flash da página para quem está logado** antes de ir ao painel: aceito (RN1), é rápido.

## Como testar

- Fotos em 375 e 1440 px, nos temas claro e escuro, com e sem "reduzir movimento".
- Teclado: Tab por todos os controles; setas nas abas do iPhone.
- Rede: abrir `/` e conferir que nenhuma requisição sai do app (CA-seg).
- Lighthouse no celular (CA-perf).
- Detector e revisor da Impeccable; agente `qa`.
- `typecheck`, `lint` e `build` do `web`.
