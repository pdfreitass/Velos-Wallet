# Spec 001 — Autenticação

- **Etapa do roadmap:** Etapa 3 — Autenticação
- **Status:** Aprovada (2026-10-12)
- **Data:** 2026-10-12

## Problema

O Velos guarda dados financeiros pessoais. Antes de qualquer outra funcionalidade (contas, transações, metas), o usuário precisa de um jeito **seguro e simples** de criar a conta, entrar e sair, e o app precisa garantir que **ninguém veja as páginas internas sem estar logado**.

Liga-se ao objetivo 1 da [VISAO](../../VISAO.md): *"Cadastro e login seguros — email/senha com confirmação ou conta Google"*.

## Histórias de usuário

- **H1** — Como **visitante**, quero criar uma conta com nome, email e senha, para começar a usar o Velos.
- **H2** — Como **visitante**, quero confirmar o meu email clicando num link, para provar que o email é meu.
- **H3** — Como **usuário**, quero entrar com email e senha, para acessar os meus dados.
- **H4** — Como **visitante ou usuário**, quero entrar com a minha conta Google, sem criar senha.
- **H5** — Como **usuário que esqueceu a senha**, quero clicar em "Esqueci minha senha" e receber um email para criar uma senha nova.
- **H6** — Como **usuário logado**, quero sair da conta, principalmente num dispositivo compartilhado.
- **H7** — Como **usuário**, quero que, ao abrir um link interno sem estar logado, o app me peça login e depois me leve **de volta** para onde eu ia.
- **H8** — Como **usuário**, quero que a minha conta seja protegida contra quem fica tentando adivinhar a minha senha.
- **H9** — Como **usuário**, quero receber emails com a cara do Velos, para confiar que vieram mesmo do app.

## Escopo

### Dentro
- Cadastro com email/senha (com confirmação de senha) + confirmação por email
- Login com email/senha, com **bloqueio temporário após tentativas erradas**
- Login/cadastro com Google
- Esqueci a senha → email → redefinir senha
- Logout
- Proteção de todas as rotas internas e redirecionamento de volta após o login
- Envio de emails pelo **servidor padrão do Supabase** (sem domínio próprio ainda; ver P7)
- **Modelos de email com a identidade Velos** (logo, cores, tom formal) para confirmação de cadastro e redefinição de senha
- Página interna mínima `/painel` com saudação e botão "Sair", só para provar o fluxo (o dashboard de verdade é a Etapa 6)
- Corrigir os textos sem acento da página/metadata (pendência T3 do ROADMAP) e tornar as chaves do Supabase obrigatórias no middleware (T4)

### Fora (explicitamente)
- Login por link mágico (sem senha), SMS ou outros provedores (Apple, GitHub…)
- Autenticação em dois fatores (2FA)
- Trocar email, trocar senha logado, excluir conta → página de configurações, etapa futura
- Editar o perfil (nome, moeda)
- Termos de uso / política de privacidade no cadastro (decidido: não no momento)
- Outros emails além de confirmação e redefinição (ex.: boas-vindas, troca de email)
- **Resend + domínio próprio** → pré-requisito do deploy (sem domínio, o Resend tem a mesma limitação do Supabase)

## Regras de negócio

- **RN1 — Senha forte:** no mínimo **8 caracteres**, com pelo menos **1 letra maiúscula**, **1 letra minúscula**, **1 número** e **1 caractere especial** (ex.: `! @ # $ % & *`). Exemplo válido: `Pedro10@`.
  - Validada no formulário (com a lista de requisitos visível, cada um marcando ✓ quando atendido), **no servidor** e **no próprio Supabase**.
- **RN2 — Confirmar senha:** no cadastro e na redefinição, a senha é digitada **duas vezes**; se forem diferentes, o erro aparece no segundo campo. Os campos têm botão "mostrar senha".
- **RN3 — Email confirmado:** quem se cadastrou com email/senha **não entra** antes de confirmar o email. Tentar entrar mostra *"Confirme seu email para entrar"* e oferece reenviar o link.
- **RN4 — Mensagens que não vazam informação:**
  - login errado → sempre *"Email ou senha incorretos"*, sem dizer qual dos dois;
  - esqueci a senha → sempre *"Se existir uma conta com esse email, enviamos um link para redefinir a senha"*, exista a conta ou não.
- **RN5 — Bloqueio por tentativas:**
  - após **5 tentativas de login erradas seguidas** para o mesmo email, o login com esse email fica **bloqueado por 10 minutos**;
  - mensagem: *"Muitas tentativas incorretas. Tente novamente em X minutos ou redefina sua senha."*, com o tempo restante e o atalho para "Esqueci minha senha";
  - **aviso antes do bloqueio**: a partir da 3ª tentativa errada, *"Mais N tentativa(s) incorreta(s) e o acesso será bloqueado por 10 minutos."*;
  - um login **certo zera** a contagem;
  - durante o bloqueio, **"Esqueci minha senha" continua funcionando**, e redefinir a senha **libera** o bloqueio;
  - a contagem vale para **qualquer email digitado**, exista a conta ou não (senão o bloqueio revelaria quais emails têm conta, violando a RN4).
- **RN6 — Esqueci minha senha:** basta clicar em "Esqueci minha senha", informar o email e confirmar; o sistema envia o email de redefinição (sujeito à RN4). O link vale por tempo limitado e **só pode ser usado uma vez**.
- **RN7 — Redirecionamento seguro:** o "voltar para onde eu ia" (H7) só aceita **caminhos internos** do próprio app (ex.: `/transacoes`). Qualquer outro endereço é ignorado e o usuário vai para `/painel`.
- **RN8 — Rotas:**
  - páginas internas sem sessão → vão para `/entrar`, guardando o destino;
  - `/entrar` e `/cadastro` **com** sessão → vão para `/painel`;
  - `/` → `/painel` se logado, `/entrar` se não.
- **RN9 — Nome:** o nome digitado no cadastro vira o nome do perfil. No Google, usa o nome da conta Google (o banco já faz isso pelo trigger `handle_new_user`).
- **RN10 — Primeiro acesso:** todo usuário novo já entra com o perfil e as **10 categorias padrão** criados (já garantido pelo banco).
- **RN11 — Mesmo email, dois jeitos:** quem se cadastrou com email/senha e depois entra com o Google usando o **mesmo email confirmado** continua na **mesma conta**.
- **RN12 — Sair encerra a sessão no servidor**, não só apaga cookies no navegador.
- **RN13 — Emails:**
  - enviados pelo servidor padrão do Supabase, que **só entrega para membros do projeto** (ou seja, para os testes do Pedro) e com limite baixo por hora; o remetente é o do Supabase até haver Resend + domínio próprio;
  - **tom formal**, em português do Brasil, com **logo**, cores da marca (verde profundo `#0A2E24`, fundo `#F4F7F2`) e rodapé institucional;
  - botão de ação principal + o link escrito por extenso (para clientes de email que bloqueiam botões);
  - aviso de segurança: *"Se você não solicitou este email, pode ignorá-lo com segurança."*;
  - funcionam no Gmail, Outlook e celular (layout de email tradicional, sem depender de CSS moderno).

## Telas e estados

Todas em **375 px** e **1440 px**, nos temas **claro e escuro**, com textos em **português do Brasil, com acento**. Botões mostram estado de **carregando** e ficam desabilitados durante o envio (evita duplo clique). Erros aparecem **perto do campo** e são anunciados para leitor de tela.

| Tela | Rota | O que tem | Estados |
|---|---|---|---|
| Entrar | `/entrar` | Email, senha (com "mostrar"), "Entrar", "Continuar com Google", links "Criar conta" e "Esqueci minha senha" | carregando · credenciais incorretas · aviso de tentativas restantes · **bloqueado (com tempo restante)** · email não confirmado (com "reenviar link") · erro de rede |
| Criar conta | `/cadastro` | Nome, email, senha, **confirmar senha**, lista de requisitos da senha com ✓, "Criar conta", "Continuar com Google", link "Entrar" | carregando · erros por campo · senhas diferentes · sucesso → "Verifique seu email" (também quando o email **já tem conta**, sem revelar isso — RN4) |
| Verifique seu email | `/cadastro/verifique-email` | Mensagem com o email usado, "Reenviar link" (com espera entre envios), link "Entrar" | reenviado · limite de envios atingido |
| Esqueci a senha | `/recuperar-senha` | Email, "Enviar link" | carregando · sucesso (mensagem neutra, RN4) |
| Nova senha | `/redefinir-senha` | Nova senha, **confirmar nova senha**, requisitos com ✓, "Salvar" (só acessível pelo link do email) | carregando · senhas diferentes · link expirado/inválido (com atalho para pedir outro) · sucesso → `/painel` |
| Painel (provisório) | `/painel` | "Olá, {nome}" + botão "Sair" | — |
| Erro de autenticação | `/auth/erro` | Mensagem amigável + "Voltar para entrar" | link expirado · link já usado · Google cancelado |

Identidade visual: logo Velos no topo das telas de entrada, botão principal em **verde profundo** (marca), nunca em verde vivo.

### Emails

| Email | Quando | Assunto (proposta) | Ação |
|---|---|---|---|
| Confirmação de cadastro | Após "Criar conta" | *Confirme seu cadastro no Velos Wallet* | Botão "Confirmar meu email" |
| Redefinição de senha | Após "Esqueci minha senha" | *Redefinição de senha — Velos Wallet* | Botão "Criar nova senha" |

## Critérios de aceite

- [ ] **CA1** — Cadastro com dados válidos leva a "Verifique seu email", e o email de confirmação chega (no email do Pedro, membro do projeto), com a identidade Velos.
- [ ] **CA2** — Clicar no link de confirmação faz login e leva a `/painel`, mostrando "Olá, {nome}".
- [ ] **CA3** — No primeiro acesso, o usuário tem 1 perfil e 10 categorias (conferido no banco).
- [ ] **CA4** — Login com email/senha corretos leva a `/painel`; incorretos mostram "Email ou senha incorretos".
- [ ] **CA5** — Login com email não confirmado é barrado com opção de reenviar o link (RN3).
- [ ] **CA6** — "Continuar com Google" cria a conta (primeira vez) ou entra (vezes seguintes), com o nome do Google.
- [ ] **CA7** — "Esqueci a senha" mostra a mensagem neutra para qualquer email; o link recebido permite definir nova senha (digitada duas vezes) e entrar com ela; o mesmo link não funciona uma segunda vez.
- [ ] **CA8** — Sem sessão, abrir `/painel` (ou qualquer rota interna) leva a `/entrar`; depois de entrar, volta para a rota original.
- [ ] **CA9** — `/entrar?next=https://site-malicioso.com` ou `?next=//site-malicioso.com` leva a `/painel`, nunca ao site externo (RN7).
- [ ] **CA10** — Logado, abrir `/entrar` ou `/cadastro` leva a `/painel`.
- [ ] **CA11** — "Sair" encerra a sessão: depois disso, `/painel` volta a pedir login, inclusive com o botão "voltar" do navegador.
- [ ] **CA12** — Senha que não cumpre a RN1 é recusada no formulário, no servidor **e** pelo Supabase; cada requisito não atendido aparece na lista.
- [ ] **CA13** — No cadastro e na redefinição, senhas diferentes nos dois campos são recusadas (RN2).
- [ ] **CA14** — 5 logins errados seguidos bloqueiam o email por 10 min, com a mensagem e o tempo restante; da 3ª à 5ª tentativa aparece o aviso; o 6º login, **mesmo com a senha certa**, é recusado durante o bloqueio; depois de 10 min (ou de redefinir a senha) o login volta a funcionar; um login certo antes do bloqueio zera a contagem.
- [ ] **CA15** — O bloqueio acontece igualmente para um email **sem conta** (RN5, última regra).
- [ ] **CA16** — Os dois emails aparecem corretamente no Gmail (web e celular) e no Outlook, com logo, cores e link alternativo.
- [ ] **CA-seg** — O agente `security` aprova: sessão verificada no servidor com `getUser()`, sem open redirect, nenhuma rota interna desprotegida, bloqueio de tentativas não contornável pelo formulário, nenhum segredo (Google Client Secret, secret key do Supabase) no código ou no client.
- [ ] **CA-a11y** — Funciona em 375 px, nos dois temas; todo campo tem `<label>`; foco visível; erros anunciados (`aria-live`/`aria-invalid`); a lista de requisitos da senha não depende só de cor (✓/✗); contraste ≥ 4,5:1.
- [ ] **CA-build** — `npm run typecheck`, `npm run lint` e `npm run build` passam; o agente `qa` aprova.

## Decisões tomadas

| | Decisão |
|---|---|
| P1 | Rotas em **português** (`/entrar`, `/cadastro`, `/painel`, `/recuperar-senha`, `/redefinir-senha`). Código em inglês. |
| P2 | **Google OAuth entra.** O Client ID/Secret vai direto no painel do Supabase; o usuário será guiado passo a passo. |
| P3 | **Resend** escolhido como servidor de email, mas só junto com o domínio próprio (ver P7). |
| P4 | Emails **formais, com logo e identidade Velos**. |
| P5 | **Sem** termos de uso no cadastro por enquanto. |
| P6 | Senha forte (RN1), **senha digitada duas vezes** (RN2), **bloqueio de 10 min após 5 erros** (RN5), "Esqueci minha senha" envia email de redefinição (RN6). |

| P7 | **Sem domínio por enquanto.** Emails pelo servidor padrão do Supabase (só chegam no email do Pedro). Resend + domínio viram pré-requisito do deploy. |
| P8 | **Minúscula incluída** na regra da senha, para o app e o Supabase recusarem exatamente as mesmas senhas. |

## Perguntas em aberto

Nenhuma.
