# ADR 0022 — Testes E2E com Playwright contra a produção

- **Status:** Aceita
- **Data:** 2026-11-03
- **Etapa:** 8 (PWA) + fecho da spec 012

## Contexto

Os critérios de aceite do Velos sempre foram conferidos **à mão** no navegador: semear dados,
navegar, apagar a sonda, repetir em cada tema e largura. Foi assim até a spec 012, que ficou
com dois fios soltos exatamente por isso: o **CA9** ("Sem categoria") precisava de uma sonda de
dados para ser visto na tela, e o **CA-a11y** pedia o `aria-live` "ouvido". Ao mesmo tempo, a
**spec 009 (PWA)** travou na T5: o teste offline (CA6) nunca rodava, porque exige cortar a rede
com uma sessão logada.

Sem uma suíte automatizada, cada nova tela aumenta a dívida de "conferir de novo tudo o que já
estava pronto". A alternativa era continuar manual ou adotar uma ferramenta de E2E.

Restrições que moldaram a decisão:

- **Não há como subir o app localmente** sem os user-secrets do banco — e segredo não passa por
  chat. Qualquer E2E realista roda **contra a produção** (`veloswallet.com.br`).
- A produção é o ambiente real de usuários: testes que criam dados precisam de **conta
  descartável + limpeza**, e não podem rodar a cada commit do CI sem acumular lixo.
- O navegador embutido do Claude **não registra service worker**; só um Chromium de verdade
  serve para os critérios do PWA.
- Regra do projeto: biblioteca nova só com motivo explicado ao Pedro.

## Decisão

**Playwright** (`@playwright/test`) em `web/e2e/`, com **dois projetos**:

1. **`readonly`** (`pwa.spec.ts`) — só leitura, seguro para **todo CI**: manifest servido sem
   login com o tipo certo (CA1), `sw.js` como JavaScript, ícones existentes, service worker
   `activated` com **Cache Storage vazio** (CA-seg) e os critérios de instalação do Chrome via
   `Page.getInstallabilityErrors` do CDP.
2. **`probe`** (`simulation.spec.ts`) — entra numa **conta fixa, já confirmada e dedicada à
   sonda** (ver a revisão de 2026-11-07, abaixo) e faz a sonda completa da **spec 012**:
   categoria + despesa no mês anterior, categoria excluída (RN11), **CA9 na tela**, parte
   estrutural do **CA-a11y** (a região `aria-live` muda com o corte) e o **CA6 offline**
   (navegação SPA sem rede → estado de erro com "Tentar de novo"). No fim, excluir a conta
   bancária apaga a movimentação de sonda. Roda **sob demanda**
   (`npm run test:e2e:probe`), nunca no CI de rotina.

A base é a produção; `E2E_BASE_URL` permite outra origem quando houver user-secrets locais.

A sonda do CA6 **encontrou e consertou um bug real**: o TanStack Query no padrão `online`
pausa toda query nova quando `navigator.onLine` é falso — offline, a tela ficava em "Carregando…"
para sempre em vez de mostrar o erro. O `query-client` passou a `networkMode: "always"`
(queries e mutações), preso por um teste de unidade.

## Consequências

- **CI ganha o job `e2e`** (readonly) em todo PR/push; artefato do relatório em falha.
- Sondas continuam necessárias para **aparelhos reais** (CA3–CA5) e para **ouvir** o leitor de
  tela: Playwright verifica a estrutura do `aria-live`, não a voz. Nenhum dos dois é automatizável.
- ~~Contas de teste se acumulam em produção na medida em que `probe` roda~~ — resolvido pela
  revisão de 2026-11-07: a sonda passou a entrar numa conta fixa.
- Nada muda no `npm run test` (vitest): E2E é um comando separado (`test:e2e*`).

## Revisão — 2026-11-07 (T6 da spec 013)

**A conta descartável por execução saiu.** Quando a confirmação de email voltou a ser exigida
([spec 013](../specs/013-confirmacao-de-email/spec.md)), o cadastro deixou de criar sessão: o
caminho passa por um link no email, que o Playwright não lê. A sonda ficava parada no cadastro.

Agora o `probe` **entra** com `signInExisting`, lendo `E2E_EMAIL` e `E2E_PASSWORD` do ambiente —
nunca do repositório. A conta tem de ser **dedicada à sonda e ficar vazia** entre execuções,
porque o roteiro conta com uma única despesa na janela da simulação; o teste confere isso antes
de começar e falha com um recado claro se houver sobra.

O que isso muda, além de destravar:

- **Acaba o lixo em produção.** Cada execução deixava um `e2e-probe-*@example.com` que ninguém
  apagava (são 7 hoje) — a consequência que este ADR aceitava "por ora".
- **A limpeza passou a ser obrigatória**, num `finally`: com a conta reutilizada, um resto de uma
  execução que morreu no meio quebra a seguinte pelo nome repetido. Uma falha na limpeza vira
  anotação do teste, para não esconder o erro da sonda.
- **O `readonly` não muda** — continua só leitura e dentro do CI de rotina.
