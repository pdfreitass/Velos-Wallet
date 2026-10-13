# Spec 003 — Página inicial

> **O QUE** fazer e **como saber que está pronto.** O **como** vai no [plan.md](plan.md), depois da aprovação.

- **Etapa do roadmap:** porta de entrada do app. Nova, pedida pelo Pedro em 2026-10-12, durante a Etapa 3. Não depende das tasks que faltam da spec 001.
- **Status:** **Aprovada** (2026-10-12)
- **Data:** 2026-10-12
- **Numeração:** 003 porque a 002 já está reservada para "Completar perfil" na spec 001. O número identifica a spec, não a ordem: esta pode ser feita antes da 002.

## Problema

Hoje quem digita o endereço do Velos cai direto na tela de login. A pessoa tem de entregar email e senha antes de entender o que o app faz e por que confiar nele. Isso vai contra a proposta de valor da [VISAO](../../VISAO.md) ("um dashboard simples e visual") e contra as métricas de validação: visitas ao site por semana e conversão em cadastro.

A página inicial mostra o app por dentro, num iPhone com as telas do produto, e leva a "Criar conta" ou "Entrar" com um toque.

## Histórias de usuário

- **H1:** Como **visitante**, quero entender em poucos segundos o que o Velos faz, antes de criar conta.
- **H2:** Como **visitante**, quero ver como o app é por dentro (saldo, entradas e saídas, gastos por categoria, metas) e mexer nele, para saber se é simples de verdade.
- **H3:** Como **visitante**, quero ir para "Criar conta" ou "Entrar" com um toque, de qualquer ponto da página.
- **H4:** Como **visitante no celular**, quero a mesma experiência no meu aparelho, sem precisar de loja de apps.
- **H5:** Como **visitante nas telas de entrada (desktop)**, quero ver o app em ação ao lado do formulário.

## Escopo

### Dentro
- Página pública em `/`, em desktop e celular, nos temas claro e escuro, com alternância de tema.
- **Primeira dobra:** marca, a frase *"Seu dinheiro na direção certa."*, um subtítulo e os botões **"Criar conta"** (principal) e **"Entrar"**. Ao lado (desktop) ou abaixo (celular), um **iPhone com as telas do app desenhadas em código** (não é imagem: fica nítido, segue o tema e responde ao toque). Em volta, cartões "flutuando" com profundidade: uma entrada de salário, uma despesa no mercado, o progresso de uma meta.
- **Interação no iPhone:** o visitante troca as telas (Contas e saldo · Entradas e saídas do mês · Gastos por categoria · Metas). No desktop, os cartões e o aparelho reagem de leve ao movimento do mouse.
- **Seções abaixo da primeira dobra** (decisão 3): Tudo num lugar só · Para onde vai seu dinheiro · Metas que saem do papel · Privado por padrão · Sem loja de apps · chamada final com os botões. O iPhone acompanha a rolagem e mostra a tela de cada seção.
- **Cabeçalho:** marca, "Entrar", "Criar conta" e alternância de tema. **Rodapé:** marca, frase e Instagram @veloswallet.
- **Telas de entrada (desktop):** o bloco de contas do painel dá lugar ao **mesmo iPhone interativo, em versão compacta**; a primeira tela dele são as contas "se somando" (decisão 4). A frase, a marca e as promessas continuam. O painel invertido por tema (claro ↔ escuro) já foi feito na T16 da spec 001.

### Fora (explicitamente)
- Depoimentos, número de usuários, avaliações, logos de imprensa ou parceiros: **não existem e não serão inventados** (PRODUCT.md).
- Lista de espera / formulário de interesse: o cadastro já está aberto (decisão 5).
- Fotos de banco de imagens: as imagens são as telas do app e elementos desenhados por nós (decisão 2).
- Preços e planos: o app é gratuito no MVP.
- Termos de uso e política de privacidade: entram antes do deploy (pré-requisito, junto com o domínio).
- Blog, FAQ extensa, outros idiomas, SEO avançado.
- Rastreadores e analytics de terceiros.
- 3D pesado (WebGL): a profundidade vem de camadas, sombras e perspectiva leves.

## Regras de negócio

- **RN1:** `/` mostra a página inicial para **visitantes**. Para quem **já está logado**, leva direto ao `/painel` (decisão 1). Isso substitui, só para `/`, a regra "`/` → `/entrar` sem sessão" da spec 001 (RN8).
- **RN2:** Todo número nas telas do iPhone e nos cartões é **ilustrativo** e aparece rotulado como exemplo. Nenhum número de uso, cliente, depoimento ou avaliação é inventado.
- **RN3:** "Criar conta" leva a `/cadastro` e "Entrar" a `/entrar`. Os dois aparecem na primeira dobra e na chamada final; no celular, "Criar conta" fica sempre a um toque (barra fixa no rodapé da tela depois da primeira dobra).
- **RN4:** Identidade do CLAUDE.md: o verde profundo é a marca, o verde vivo é dinheiro e acento e nunca é o botão principal no tema claro; valores sempre em R$ com sinal `+`/`-` (nunca só a cor); contraste ≥ 4,5:1 nos dois temas.
- **RN5:** Movimento com propósito: com "reduzir movimento" ligado no sistema, nada se mexe sozinho e nenhum conteúdo some ou fica pela metade.
- **RN6:** Tudo funciona por teclado e leitor de tela: a troca de telas do iPhone usa controles reais com rótulo; o conteúdo do aparelho é texto legível, não só imagem.
- **RN7:** Página leve no celular: a primeira dobra aparece rápido mesmo em 4G (meta no plano).
- **RN8:** Privacidade: a página inicial não chama nenhum serviço de terceiros (nem fontes externas, nem rastreadores).

## Telas e estados

| Tela | Rota | Estados | Observações |
|---|---|---|---|
| Página inicial | `/` | primeira dobra · seções · tema claro e escuro · reduzir movimento | 375 px e 1440 px; sem lista nem dados reais, então sem estado vazio |
| Telas de entrada (painel do desktop) | `/entrar`, `/cadastro` | claro e escuro (painel invertido, já feito) · reduzir movimento | iPhone interativo compacto no lugar do bloco de contas |

Textos em português do Brasil, com acento, na voz **próxima e direta** do PRODUCT.md.

## Critérios de aceite

- [ ] **CA1:** Dado um visitante, quando abre `/`, então vê a página inicial, não a tela de login. Dado um usuário logado, então vai direto para `/painel`.
- [ ] **CA2:** Em 375 px e em 1440 px, a marca, a frase, o subtítulo, "Criar conta" e "Entrar" aparecem sem rolar.
- [ ] **CA3:** O iPhone mostra pelo menos 4 telas do app (contas e saldo, entradas e saídas, gastos por categoria, metas). O visitante troca de tela por controles visíveis, inclusive pelo teclado.
- [ ] **CA4:** Todo valor aparece em R$, com sinal `+`/`-` e ícone, e o conjunto é rotulado como exemplo.
- [ ] **CA5:** "Criar conta" leva a `/cadastro` e "Entrar" a `/entrar`, de qualquer seção. No celular, "Criar conta" fica a um toque depois da primeira dobra.
- [ ] **CA6:** Nos temas claro e escuro, a página é coerente e nunca vira "tudo uma cor só".
- [ ] **CA7:** Com "reduzir movimento", nada some nem fica pela metade, e não há animação contínua.
- [ ] **CA8:** No desktop, o painel das telas de entrada mostra o iPhone interativo compacto, começando pelas contas "se somando", sem atrapalhar o formulário.
- [ ] **CA-perf:** Lighthouse no celular com desempenho ≥ 90 na página inicial.
- [ ] **CA-seg:** A página inicial não faz nenhuma chamada para fora do próprio app (rede conferida no navegador).
- [ ] **CA-a11y:** Funciona em 375 px, nos dois temas, por teclado e leitor de tela; nenhuma informação depende só da cor; contraste ≥ 4,5:1.
- [ ] **CA-build:** `typecheck`, `lint` e `build` do `web` passam; o agente `qa` aprova.

## Referências

Pesquisa no Dribbble (2026-10-12): buscas "finance app landing page" (inclusive filtrando pelo verde da marca) e "wallet app ui". Padrões que servem ao Velos: iPhone como peça central da primeira dobra; cartões da interface flutuando em volta com profundidade; aparelhos inclinados em perspectiva; telas de carteira com saldo grande, gráfico, categorias com ícone e lista de transações; variantes em verde-escuro. Padrões descartados: números de usuários e logos de parceiros (não temos), estética de cripto e neon, cartões 3D genéricos.

## Decisões tomadas (2026-10-12)

| | Decisão |
|---|---|
| 1 | Usuário logado que abre `/` vai **direto ao painel**. |
| 2 | Imagens: **só as telas do app** desenhadas em código e elementos próprios (cartões, ícones). Sem fotos de banco de imagens. |
| 3 | Página com **primeira dobra + seções**; o iPhone acompanha a rolagem. |
| 4 | Painel das telas de entrada: **iPhone interativo compacto** no lugar do bloco de contas. |
| 5 | **Sem lista de espera** por enquanto (o cadastro está aberto). |
| 6 | Painel das telas de entrada **invertido por tema** (feito na T16 da spec 001): verde profundo com a página clara, off-white com a página escura. |

## Perguntas em aberto

Nenhuma.
