# Spec 009 — PWA instalável

> **O QUE** fazer e **como saber que está pronto.** Detalhe técnico vai no `plan.md` (depois da aprovação).

- **Etapa do roadmap:** Etapa 8 — PWA
- **Status:** Aprovada (Pedro, 2026-10-18, P1–P5 conforme a proposta; P1 detalhada no plan.md)
- **Data:** 2026-10-18
- **Numeração:** 009 (era 007). A [spec 007 — Fundação](../007-fundacao/spec.md), escrita no mesmo dia em outra linha de trabalho, também pegou o 007 e chegou antes na `main` (PR #4). Esta foi renumerada em 2026-11-01 para desfazer a colisão; os commits anteriores do PWA citam "spec 007".
- **Decisão de base:** [ADR 0010](../../adr/0010-pwa-antes-de-app-nativo.md) — PWA **apenas instalável**, sem offline-first

## Problema

A [VISAO](../../VISAO.md) promete "**Sem loja de apps.** Instala direto do navegador, no celular e no PC", e a página inicial fecha com "Sem loja de apps.". Hoje o Velos Wallet é só um site: não aparece na tela inicial do celular, abre com a barra do navegador e não tem ícone próprio. Quem lança gastos várias vezes por dia precisa abrir o navegador e digitar o endereço.

## Histórias de usuário

- Como **usuário de celular**, quero adicionar o Velos Wallet à tela inicial, para abrir com um toque, como um app.
- Como **usuário de PC**, quero instalar o Velos Wallet pelo navegador, para abrir numa janela própria.
- Como **usuário**, quero ver o ícone e o nome do Velos Wallet na tela inicial e no seletor de apps, para reconhecer o app.

## Escopo

### Dentro
- **Manifest** do app: nome, nome curto, descrição, cores, ícones, abrir em janela própria (`standalone`), idioma `pt-BR`.
- **Ícones** a partir da marca existente (`web/public/brand/`, 1080×1080): tamanhos para Android/Chrome, ícone "maskable" (com margem de segurança para o recorte redondo do Android) e `apple-touch-icon` para iPhone.
- **Meta tags** no `<head>` do `index.html` para iPhone (nome, ícone e barra de status).
- Ao abrir o app instalado, a pessoa cai no **Início** se estiver logada, e na tela de **Entrar** se não estiver (o comportamento de rota privada que já existe).

### Fora (explicitamente)
- **Offline-first, cache de dados, sincronização** ([ADR 0010](../../adr/0010-pwa-antes-de-app-nativo.md), VISAO §"Fora do escopo").
- **Notificações push.**
- **App nativo** e publicação em loja.
- Botão "Instalar app" dentro do produto (ver **P2**).

## Regras de negócio

- **RN1 — Só instalável.** Nenhum dado financeiro é guardado no aparelho pela PWA. Sem internet, o app mostra o mesmo erro de conexão que o site já mostra; nunca um saldo antigo como se fosse atual.
- **RN2 — Mesma origem, mesma sessão.** O app instalado usa a mesma origem e os mesmos cookies `httpOnly` do site. Nada de token no aparelho (regra do `CLAUDE.md`).
- **RN3 — Abrir no lugar certo.** O endereço inicial é o Início (`/painel`); a proteção de rota já existente manda para Entrar quem não tem sessão.
- **RN4 — Identidade.** Nome "Velos Wallet", nome curto "Velos". Cor da barra e do fundo de abertura = verde profundo `#0A2E24` (tema padrão escuro, [ADR 0016](../../adr/0016-verde-escuro-como-tema-padrao.md)). O ícone segue a marca existente, sem desenho novo.
- **RN5 — Nada de biblioteca nova sem motivo.** Sem offline, um manifest estático e ícones em `web/public/` bastam; se o plano concluir que algum navegador exige *service worker* para oferecer a instalação, o motivo é explicado ao Pedro **antes** de qualquer `npm install` (ver **P1**).

## Telas e estados

Não há tela nova. O que muda é a "casca":

| Onde | Como deve ficar |
|---|---|
| Android (Chrome) | Menu do navegador oferece "Instalar app"/"Adicionar à tela inicial"; ícone redondo sem corte da marca; abre sem barra de endereço; tela de abertura em verde profundo com o ícone |
| iPhone (Safari) | "Compartilhar → Adicionar à Tela de Início" mostra o ícone e o nome "Velos"; abre sem barra do Safari |
| PC (Chrome/Edge) | Ícone de instalar na barra de endereço; abre em janela própria com o título "Velos Wallet" |
| App instalado, sem sessão | Tela de Entrar, como no site |
| App instalado, sem internet | O erro de conexão que as listas já têm (estado de erro), sem tela branca |

## Critérios de aceite

- [ ] **CA1** — O manifest é servido pela API em produção (`dotnet run` com o build do front) com o tipo de conteúdo correto, **sem login**, e passa sem erros no painel "Manifest" do Chrome DevTools.
- [ ] **CA2** — No Chrome do PC, o app é instalável e abre em janela própria no Início (logado) ou em Entrar (deslogado).
- [ ] **CA3** — No Android, "Instalar app" aparece; o ícone instalado não é cortado (teste do maskable) e a tela de abertura é verde profundo.
- [ ] **CA4** — No iPhone, "Adicionar à Tela de Início" usa o ícone e o nome "Velos", e o app abre sem a barra do Safari.
- [ ] **CA5** — Login com email e senha funciona **dentro** do app instalado, e a sessão continua depois de fechar e reabrir o app.
- [ ] **CA6** — Sem internet, o app instalado mostra o estado de erro das telas, sem tela branca e sem dado velho.
- [ ] **CA-seg** — Nenhum dado do usuário é guardado em cache pela PWA; manifest e ícones são os únicos arquivos novos públicos.
- [ ] **CA-a11y** — Ícones com contraste visível nos fundos claro e escuro do sistema; `lang="pt-BR"` mantido.
- [ ] **CA-build** — `npm run typecheck`, `npm run lint` e `npm run build` do `web`; `dotnet build api` e `dotnet test api`.

## Perguntas em aberto

- [x] **P1 — Service worker.** Os navegadores atuais deixam instalar só com o manifest? Se o Chrome ainda exigir um *service worker* para mostrar "Instalar", a proposta é um arquivo mínimo escrito à mão, **sem cache** (só para cumprir o critério), em vez de uma biblioteca como `vite-plugin-pwa`. Verificar na fase de plano e trazer o resultado antes de decidir.
- [x] **P2 — Convite para instalar.** Mostrar dentro do app um aviso "Instale o Velos" (no Android usando o pedido de instalação do navegador; no iPhone com as instruções de Compartilhar)? Proposta: **não nesta etapa**; só a instalação pelo navegador. Pode virar uma spec pequena depois.
- [x] **P3 — Login com Google no iPhone instalado.** No iOS, o app instalado pode abrir o Google numa aba do Safari, com cookies separados: o login termina no Safari e não no app. Proposta: testar no CA5 também com Google; se falhar, documentar "no iPhone instalado, entre com email e senha" como limitação conhecida, sem gambiarra.
- [x] **P4 — Ícone.** Usar `velos-escuro.png` (símbolo sobre verde profundo) como base para todos os tamanhos? Proposta: sim, por combinar com a cor de abertura `#0A2E24`.
- [x] **P5 — Teste em aparelho real.** Os CA3–CA5 precisam de HTTPS fora de `localhost`. Opção já existente: o HTTPS opcional do Vite pela rede local (`VELOS_DEV_PFX`). Confirmar que o Pedro tem um Android e/ou iPhone para o teste, ou aceitar o CA2 + emulação do DevTools até o deploy.
