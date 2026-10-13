# Tasks — Spec 003: Página inicial

> Passos pequenos e verificáveis, derivados do [plan.md](plan.md). O Pedro pediu para seguir direto e receber o endereço local no fim (2026-10-12).

**Branch:** `devpedro`

## Preparação
- [x] **T0:** spec e plano aprovados (2026-10-12)

## Base
- [x] **T1:** carregamento sob demanda: entrar, cadastro e painel em `lazy()` com `Suspense`
  - Verificação: o pacote inicial de `/` não inclui Zod nem React Hook Form; build e navegação continuam funcionando
- [x] **T2:** vitrine do app (`features/showcase/`): `PhoneMockup` (`hero` e `compact`), as 4 telas, `ScreenTabs` (abas acessíveis), `showcase-data.ts` (exemplo rotulado)
  - Verificação: setas do teclado trocam as abas; valores em R$ com sinal e ícone; claro e escuro

## Composição
- [x] **T3:** rodada de composições da Impeccable (3 opções da primeira dobra numa página local) → escolha do Pedro registrada no contrato de direção
- [x] **T4:** primeira dobra conforme a composição escolhida: cabeçalho, frase, botões, iPhone com abas, cartões flutuantes, profundidade com o mouse
  - Verificação: CA2 em 375 e 1440; RN5 com "reduzir movimento"
- [x] **T5:** seções com o iPhone acompanhando a rolagem (desktop), telas próprias no celular, barra fixa "Criar conta" no celular, rodapé
  - Verificação: CA3, CA5

## Regras e painel
- [x] **T6:** `/` para visitante mostra a página; logado vai a `/painel` (RN1)
  - Verificação: CA1
- [x] **T7:** painel das telas de entrada com o iPhone compacto no lugar do bloco de contas
  - Verificação: CA8

## Fechamento
- [x] **T8:** fotos 375/1440 nos dois temas e com "reduzir movimento"; teclado; rede sem chamadas externas (CA-seg); Lighthouse no celular (CA-perf)
- [x] **T9:** detector + revisor de acabamento da Impeccable; agente `qa`
- [x] **T10:** `typecheck`, `lint`, `build`; registro aqui; endereço local para o Pedro

## Registro

| Task | Commit | Observação |
|---|---|---|
| T1 | | Página inicial carrega junto (porta de entrada); entrar, cadastro, painel e 404 em `lazy()`. Conferido no build: Zod e React Hook Form só no pedaço `auth-*.js` (40 KB gzip); pacote inicial 99 KB gzip |
| T2 | | `features/showcase/`: `PhoneMockup` (hero, compact, peek, mini), 4 telas, `ScreenTabs` (abas WAI-ARIA; setas, Home, End), `Ticker` (dígitos que rolam), `showcase-data.ts` com as categorias reais do seed. O iPhone escala inteiro: dentro da tela, `--spacing` e `--text-*` do Tailwind viram frações de `--phone-w` |
| T3 | | Composição "Tudo converge" escolhida pelo Pedro na sessão anterior (`.impeccable/mocks/decision/tudo-converge.html`) |
| T4 | | Fios calculados em JS a partir das posições reais (cartão → linha da conta no iPhone; no celular, até o topo do aparelho), todos dobrando na mesma faixa para não se cruzar; pulso de abertura e soma das contas; um fio aceso em repouso (Poupança); inclinação com o mouse só com ponteiro fino e sem "reduzir movimento" |
| T5 | | UM iPhone no desktop, fixo na coluna da direita e trocando de tela pela seção no meio da tela (IntersectionObserver); no celular, aparelho cortado por seção. Faixa invertida "Privado por padrão", fechamento "Sem loja de apps." com navegador + iPhone, barra fixa "Criar conta" no celular (conferida rolando em 375×812), rodapé com @veloswallet |
| T6 | | `/` dentro de `GuestOnly` (logado → `/painel`); `RootRedirect` removido |
| T7 | | `BrandPanel` com o iPhone compacto e abas; `AccountsSumExample` removido (virou `AccountsScreen`) |
| T8 | | Fotos em `.impeccable/review/` (375 e 1440, claro e escuro, mouse em cima, seções). Rede: nenhuma requisição fora da origem (CA-seg). Lighthouse no celular (build de produção, gzip): desempenho 85–90 no começo; **93–96** depois de isolar o estado dos fios no `ConvergeWires` (o `Story` inteiro re-renderizava a cada quadro do mouse). Acessibilidade **100** depois de 2 correções (vermelho da dívida sobre card escuro a 3,71:1; nome acessível dos cartões) |
| T9 | | Detector Impeccable: 0 achados. Revisor de acabamento: `fix` (6 itens) → lote aplicado (artefatos com fio nas seções de contas e gastos, seção do cartão reescrita, fio aceso em repouso, navegador legível) → verdict pass: 3 resolvidos, 1 parcial, regressões R1–R3 corrigidas. **Em aberto (parcial):** os fios das seções apontam para o iPhone fixo, mas não chegam até a linha exata da tela. `qa`: aprovado com ressalvas; corrigidos re-render a 60 fps, promessa das fontes sem cancelar e foco coberto pela barra do celular. `DESIGN.md` + `.impeccable/design.json` escritos pelo documentador |
| T10 | | `typecheck`, `lint` e `build` do `web` passam. Endereço local: http://localhost:3000/ |
