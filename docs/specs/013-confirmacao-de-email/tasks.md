# Tasks — Spec 013: Confirmação de email no cadastro

> Passos pequenos e verificáveis, a partir do [plan.md](plan.md). Só marcar `[x]` depois de verificar.
> Uma task por vez. Ao terminar cada uma: parar, mostrar, e só então seguir.
> `dotnet build api`, `dotnet test api`, `typecheck`, `lint`, `test` e `build` do `web` passam antes de fechar qualquer task de código.

## Back

### [x] T1 — Cliente Supabase com PKCE e resend
`api/src/Velos.Infrastructure/Supabase/SupabaseAuthClient.cs`
- `SignUpAsync(name, email, password, codeChallenge, redirectTo)` → `signup?redirect_to=…` com `code_challenge`/`code_challenge_method` no corpo.
- Novo `SendSignupConfirmationAsync(email, codeChallenge, redirectTo)` → `POST resend` com `type=signup`.
- Mapeamentos existentes ficam: resposta sem sessão no cadastro → `ConfirmationRequired`; `email_not_confirmed` → `EmailNotConfirmed`.
- Teste de unidade não cobre HTTP real; a prova é o teste de integração (T3-bis).

**Pronto quando:** compila e os testes existentes continuam verdes.

---

### [x] T2 — Application: cadastro, confirmação e reenvio
`api/src/Velos.Application/Auth/`

- `SignUpHandler` devolve `Result<SignUpStarted>` (`AuthSession? Session` + `string? CodeVerifier`); gera `PkcePair` quando a confirmação é exigida.
- Novo `ConfirmSignUpHandler` (molde: `ConfirmPasswordResetHandler`) com `SignUpConfirmationErrors.InvalidLink`.
- Novo `RequestSignUpConfirmationHandler` (molde: `RequestPasswordResetHandler`, resposta neutra RN4).
- Testes: verifier sem sessão / sessão direta; link inválido (sem code, sem verifier, Supabase recusa); reenvio neutro e erro quando o serviço está fora.

**Pronto quando:** testes da `Velos.Application.Tests` cobrem os três handlers.

---

### [x] T3 — Api: rotas, cookie e redirects
`api/src/Velos.Api/Auth/AuthFlowCookies.cs`, `AuthController.cs`, `AuthCallbackController.cs`

- `AuthFlowCookies`: `velos_signup` com protector `"Velos.Signup.Pkce"`, 1 h, httpOnly, path `/`.
- `POST /api/auth/sign-up`: verifier → cookie + 201; sessão → como hoje.
- `POST /api/auth/sign-up/resend` (AllowAnonymous + limite por IP): 202 + verifier no cookie.
- `GET /auth/confirmar-cadastro`: troca o code, grava sessão, `/painel`; falha → `/entrar?erro=confirmacao`; consome o verifier sempre.
- Testes de Api: cookie no cadastro, neutralidade do reenvio, redirects, propósitos separados (verifier do cadastro não vale no reset e vice-versa).

**Pronto quando:** testes da `Velos.Api.Tests` verdes e a rota responde 401/limite conforme o caso.

---

### [x] T3-bis — Prova de integração

**Desbloqueada e feita em 2026-11-07, contra a produção**, com um alias do Gmail
(`…+t3bis@gmail.com`), exatamente como o plano abaixo previa: o email chegou, o link confirmou e
a conta entrou. No banco, a conta aparece com `email_confirmed_at` **e** `last_sign_in_at`
preenchidos.

O histórico do bloqueio fica registrado abaixo, porque a causa vale para a próxima vez.

---

#### Histórico — Prova de integração (máquina com user-secrets)
- Cadastro com a flag ligada dispara email (auth logs do Supabase) e devolve verifier, sem sessão.
- Resend dispara email novo.
- Troca do `code` com o verifier cria sessão.

**Pronto quando:** rodar localmente com user-secrets — se o Pedro não tiver as credenciais aqui, marcar "a provar no deploy" e seguir.

**Estado anterior (2026-11-07, de manhã): BLOQUEADO por falta de um email que dê para ler.**

Tentei provar contra a produção e o email não chega: **o Resend recusa tudo o que vai para
`@mailinator.com`**. No painel do Resend, as 11 sondas de 03/11 e as 2 de hoje estão todas
**`Bounced`**; o único `Delivered` é para o Gmail do Pedro. Foi por isso que esta task ficou
aberta desde o início — não é o fluxo que falha, é o endereço de teste.

> 🔎 **O que o Resend ainda assim provou:** as sondas de 03/11 saíram com o assunto
> *"Confirm your email address"* (o modelo padrão, em inglês) e as de hoje com
> *"Confirme seu cadastro no Velos Wallet"*. Ou seja, **o modelo em português está publicado e
> ativo** — o que confirma a T5 por outro caminho.

**Para destravar,** um endereço que receba de verdade e que dê para abrir. O mais simples é um
alias do próprio Gmail do Pedro (`...+t3bis@gmail.com`): o Gmail entrega na mesma caixa e o
Supabase trata como usuário diferente, então não colide com a conta real.

**Estado anterior (2026-11-03):** a provar no deploy. A máquina TEM os user-secrets, mas a flag *Confirm email* está desligada na produção e **só pode ser ligada depois do deploy** do código novo (T1–T3) — ligar antes quebraria os cadastros no ar, que ainda rodam o código antigo. Com a flag desligada o reenvio não dispara email de verdade, então o risco do T1 (GoTrue ignorar o PKCE no resend) não é provável agora. A prova roda no fecho, contra a produção, junto da T5/T6.

## Front

### [x] T4 — Telas do fluxo
`web/src/features/auth/`

- `api.ts`: `resendSignUpConfirmation(email)`.
- `SignUpForm`: estado de sucesso "Enviamos um link para **{email}**" + spam + "Reenviar email" (com feedback) + "Já confirmou? Entrar".
- `SignInForm`: `email_not_confirmed` → mensagem + botão de reenviar.
- `SignInPage`: `?erro=confirmacao` → "Este link não é mais válido. Peça outro."
- 375 px, dois temas, `role=status`/`role=alert`.

- Em 2026-11-07 a tela de entrar ganhou também o caso da **RN9** (`?aviso=confirmado`), num
  componente próprio, `SignUpConfirmationNotice`: `role="status"` em vez de `role="alert"`,
  porque não é erro.

**Pronto quando:** typecheck/lint/test/build verdes; estados vistos à mão (dev com a flag desligada mostra o caminho da sessão direta).

**Feito.** Conferido no navegador em 2026-11-07, em 375 px e nos dois temas: os dois avisos da
tela de entrar (`?aviso=confirmado` e `?erro=confirmacao`). **A tela de sucesso do cadastro e o
reenvio não foram revistos à mão nesta sessão** — ficam no CA-a11y, ainda aberto.

---

### [x] T5 — Template do email + passos do Pedro no painel
`supabase/templates/confirmation.html`

- [x] Link → `{{ .ConfirmationURL }}` (4 ocorrências); remover a nota "GUARDADO, NÃO ATIVAR"; `npm run preview:emails`.
- [x] `web/scripts/supabase-templates-edit.mjs`: publica o modelo no painel por Playwright, já que o Supabase não lê esta pasta.
- [x] **No painel:** flag *Confirm email* ligada, redirect URLs cobertas, modelo publicado na aba *Confirm signup*.

**Conferido no painel em 2026-11-07:**

| Peça | Estado |
|---|---|
| Flag *Confirm email* | ligada desde 03/11 (as sondas no mailinator provam) |
| Modelo em *Confirm signup* | publicado: assunto "Confirme seu cadastro no Velos Wallet", 5 ocorrências de `{{ .ConfirmationURL }}`, nenhum `token_hash` |
| O publicado é o versionado? | **sim** — 7841 bytes contra 7704 do arquivo, e a diferença são exatamente os 137 `\r` das 138 linhas: o painel guarda em CRLF |
| Redirect URLs | `http://localhost:3000/*`, `…/auth/confirm*`, `…/auth/callback*` |

> ⚠️ **O `/auth/confirmar-cadastro` é coberto por acidente.** O wildcard `…/auth/confirm*` casa
> com ele — e com qualquer rota que comece por `confirm`. Funciona, mas se a rota for renomeada
> quebra em silêncio. Trocar por entradas explícitas exige cuidado: `/auth/confirm` é a da
> recuperação de senha, e mexer ali derruba os dois fluxos.

> **Ao usar o script:** apagar a cópia do perfil do Chrome depois. Ela leva os cookies e o Local
> Storage — a sessão do Supabase em claro — e o Temp não se limpa sozinho.

---

### 🟡 T6 — E2E (código pronto; falta rodar o `probe`)
`web/e2e/`

- [x] `helpers.ts`: `signInExisting(page)` com `E2E_EMAIL`/`E2E_PASSWORD` (env) e erro claro se
  faltarem — a mensagem diz o que definir, em vez de falhar num seletor.
- [x] `simulation.spec.ts`: o cadastro saiu; a sonda entra com a conta confirmada. **De quebra,
  acabam os usuários órfãos**: cada execução criava um `e2e-probe-*@example.com` que ninguém
  apagava (há 7 em produção).
- [x] A limpeza passou para um `finally`, com `deleteCategoryIfPresent` /
  `deleteBankAccountIfPresent`: a conta agora é reutilizada, então um resto de uma execução que
  morreu no meio quebraria a seguinte pelo nome repetido.
- [x] `readonly` verde contra a produção (4/4, 2026-11-07).
- [x] Pré-condição: a sonda confere que a conta está vazia antes de começar, e a limpeza falhada
  vira anotação do teste em vez de esconder o erro da sonda.

**Falta (do Pedro):** definir `E2E_EMAIL`/`E2E_PASSWORD` com uma conta **confirmada e dedicada
à sonda, sem dados próprios** — o roteiro conta com uma única despesa na janela da simulação — e
rodar `npm run test:e2e:probe --prefix web`. **O `probe` nunca foi rodado nesta mudança**, por
falta dessas variáveis.

> ⚠️ **O endereço da conta não entra neste arquivo.** O repositório é público: nomear a caixa que
> tem senha de escrita na produção é entregar metade do par. Senha longa e aleatória, só no
> ambiente — e **nunca** a `Velos-E2E-Sonda-123!` que está no histórico (ver a revisão `security`
> abaixo, na T7).

---

## Fecho

### [x] T7 — Bateria completa e revisões
*2026-11-07*

**Bateria:** `dotnet build api` 0 erros · Domain 153 · Application 190 · Api 43 · `typecheck`,
`lint`, `test` (59) e `build` do `web` · E2E `readonly` **4/4 contra a produção**.

> ⚠️ **`dotnet test api` não fecha nesta máquina:** 24 dos 33 testes de **integração** falham com
> `23503 accounts_user_id_fkey` — o `Tests:UserId` dos user-secrets aponta para um usuário apagado
> do banco. É ambiente, não código ([L48](../../LICOES.md)), mas o CA-build só fecha depois de
> corrigido.

**Revisão `qa`:** PRONTO COM RESSALVAS. Atendidas: espera por estado positivo na limpeza do E2E
(um `count()` cedo demais pulava a limpeza em silêncio), limpeza que não esconde o erro da sonda,
pré-condição da conta vazia, e o comentário do `playwright.config.ts`. Registradas sem resolver: a
T6 voltou a 🟡 (o `probe` não rodou) e não há teste de componente para o aviso novo — o projeto não
tem `@testing-library/react`, e biblioteca nova precisa do OK do Pedro.

**Revisão `security`:** APROVADO COM RESSALVAS; **CA-seg aprovado**. Atendidas:

- **Reenvio com política de limite própria** (`SignUpResend`, 3 a cada 15 min por IP, como a da
  recuperação de senha). Estava na política `Auth`, 10/min — 150 em 15 minutos: bomba de caixa de
  entrada e, pior, cota de email do projeto esgotada, derrubando cadastro **e** recuperação.
- **O 429 do Supabase deixou de subir no reenvio** (RN4): o `SMTP_MAX_FREQUENCY` é **por usuário**,
  então devolvê-lo revelava que o email tem cadastro. Preço consciente: quem clica "reenviar" duas
  vezes em menos de 60 s vê "enviamos" sem email novo — mitigar na UI, com contagem no botão, como
  no fluxo de reset. **Fica como pendência de UX.**
- **A RN9 deixou de inferir:** a rota lê `error`/`error_code` do GoTrue e trata erro declarado
  primeiro, mesmo com um `code` junto. A premissa virou contrato, com teste.
- **O verificador só é consumido quando há `code`:** apagá-lo sempre deixava qualquer página de
  terceiros matar um cadastro em andamento com um `<img>` (o cookie é `SameSite=Lax`).
- **Cookie que chega e não desprotege agora é logado** (adulterado, de outro fluxo ou vencido): o
  desfecho continua o mesmo, mas a tentativa deixa rastro.
- **O endereço da conta de sonda saiu deste arquivo** (repositório público).
- **[ADR 0023](../../adr/0023-confirmacao-de-email-tres-desfechos.md)** escrito: os três desfechos,
  o motivo de aceitar o `?code=` forjado e o que invalidaria a decisão.

> 🔴 **HIGH em aberto, e é do Pedro.** A senha `Velos-E2E-Sonda-123!` está no histórico de um
> repositório **público** (`08c1ec3`) e **7 contas `e2e-probe-*@example.com` continuam vivas em
> produção** com ela. São sessões autenticadas reais na API. **Apagar essas contas no painel do
> Supabase** fecha o buraco — reescrever o histórico não é preciso, a senha só vale enquanto
> existir conta que a aceite. E não reaproveitar essa senha como `E2E_PASSWORD`.

### [x] T8 — Documentação
*2026-11-07*

- [x] **ROADMAP**: o C1 saiu da lista de pré-deploy (item 6, agora riscado) e a spec 013 entrou na seção "Pronto", com a pendência do `probe` nomeada.
- [x] **CHANGELOG**: entrada de 2026-11-07 (adicionado, corrigido, alterado e pendente).
- [x] **LICOES**: três lições novas — **L46** (num caminho de erro, o recado errado custa mais que o erro), **L47** (mudar a premissa de uma sonda E2E exige varrer a documentação) e **L48** (apagar conta de teste da produção quebra os testes de integração). A L45 ganhou o ponteiro para a L47.
- [x] **ADR 0022**: seção "Revisão — 2026-11-07" explicando por que a conta descartável saiu; a consequência "contas de teste se acumulam" foi riscada.
- [x] **Varredura** de `descartável`/`e2e-probe`: `playwright.config.ts`, `ARQUITETURA.md`, `CHANGELOG.md`, `ci.yml` e `LICOES.md` atualizados no mesmo commit (foi o que virou a L47).
- [x] **Spec 013** marcada como **Entregue**, com os critérios de aceite marcados **só onde há prova** — e os outros deixados abertos, com o motivo.

**Não é "Concluída", é "Entregue".** Falta o `probe` (T6) e quatro critérios de aceite nunca
conferidos à mão (CA3, CA5, CA6, CA7).
