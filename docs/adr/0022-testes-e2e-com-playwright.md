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
2. **`probe`** (`simulation.spec.ts`) — cria uma **conta descartável** (o cadastro dispensa
   confirmação de email, C1 pendente) e faz a sonda completa da **spec 012**: categoria +
   despesa no mês anterior, categoria excluída (RN11), **CA9 na tela**, parte estrutural do
   **CA-a11y** (a região `aria-live` muda com o corte) e o **CA6 offline** (navegação SPA sem
   rede → estado de erro com "Tentar de novo"). No fim, excluir a conta bancária apaga a
   movimentação de sonda; a conta de usuário fica (não existe exclusão ainda). Roda **sob
   demanda** (`npm run test:e2e:probe`), nunca no CI de rotina.

A base é a produção; `E2E_BASE_URL` permite outra origem quando houver user-secrets locais.

A sonda do CA6 **encontrou e consertou um bug real**: o TanStack Query no padrão `online`
pausa toda query nova quando `navigator.onLine` é falso — offline, a tela ficava em "Carregando…"
para sempre em vez de mostrar o erro. O `query-client` passou a `networkMode: "always"`
(queries e mutações), preso por um teste de unidade.

## Consequências

- **CI ganha o job `e2e`** (readonly) em todo PR/push; artefato do relatório em falha.
- Sondas continuam necessárias para **aparelhos reais** (CA3–CA5) e para **ouvir** o leitor de
  tela: Playwright verifica a estrutura do `aria-live`, não a voz. Nenhum dos dois é automatizável.
- Contas de teste se acumulam em produção na medida em que `probe` roda — aceito por ora;
  a exclusão de conta de usuário (C1) resolve de vez.
- Nada muda no `npm run test` (vitest): E2E é um comando separado (`test:e2e*`).
