# Plano — Spec 013: Confirmação de email no cadastro

> **COMO** fazer a [spec.md](spec.md). Sem migration, sem biblioteca nova. O molde é o fluxo de
> redefinição de senha da spec 001 (PKCE + cookie de verifier), que já está validado no ar.

## Arquitetura do fluxo

```
1. Cadastro          POST /api/auth/sign-up
                       → Supabase /signup com code_challenge (PKCE) + redirect_to
                       → sem sessão (Confirm email ligado): grava o verifier no cookie
                         httpOnly velos_signup e responde 201
2. Email             "Confirme seu cadastro" (visual do recovery), link =
                       /auth/confirmar-cadastro?code=<code de uso único>
3. Clique            GET /auth/confirmar-cadastro (fora de /api, responde 302)
                       → lê code + verifier do cookie (propósito próprio, uso único)
                       → troca via token?grant_type=pkce
                       → grava a sessão e vai para /painel
                       → qualquer falha: /entrar?erro=confirmacao
4. Reenvio           POST /api/auth/sign-up/resend (limite por IP)
                       → Supabase /resend type=signup com novo PKCE + redirect_to
                       → novo verifier no cookie; resposta neutra (RN4)
```

O caminho de volta dos dois emails é a **mesma rota nova** `/auth/confirmar-cadastro`. A rota
`/auth/confirm` de hoje continua sendo só da redefinição de senha (verifier e propósito
diferentes).

## Back (API .NET)

### T1 — `SupabaseAuthClient` (Infrastructure)
- `SignUpAsync` ganha `codeChallenge` e `redirectTo`: chama `signup?redirect_to=<url>` (na query,
  como o `recover`) com `code_challenge` + `code_challenge_method` no corpo. A resposta sem
  sessão continua caindo no mapeamento existente `isSignUp → ConfirmationRequired`; com sessão
  (Confirm email desligado, ex.: dev), devolve a sessão como hoje.
- Novo `SendSignupConfirmationAsync(email, codeChallenge, redirectTo)`: `POST resend` com corpo
  `{ type: "signup", email, code_challenge, code_challenge_method, email_redirect_to }`.
  **Risco mapeado:** se o GoTrue ignorar o challenge no resend e mandar um link implícito, o
  teste de integração acusa — o fallback é trocar o resend para o formato que o Supabase espera
  (`options.emailRedirectTo` na query) mantendo o PKCE, e se ainda assim não der, registrar o
  achado e voltar ao Pedro antes de decidir.
- `ExchangeCodeAsync` já serve os dois fluxos (mesmo `grant_type=pkce`).

### T2 — Application
- `SignUpHandler` passa a devolver `Result<SignUpStarted>`: `SignUpStarted` tem
  `AuthSession? Session` e `string? CodeVerifier`. Confirmação exigida ⇒ só o verifier vem;
  sessão direta (dev) ⇒ só a sessão vem. O `PkcePair.Create()` já existe.
- Novo `ConfirmSignUpHandler`: mesmo formato do `ConfirmPasswordResetHandler` — sem `code` ou
  verifier ⇒ `SignUpConfirmationErrors.InvalidLink` ("Este link não é mais válido. Peça outro."),
  recusa do Supabase ⇒ o mesmo erro (não revela se expirou, foi usado ou nunca existiu).
- Novo `RequestSignUpConfirmationHandler` (reenvio): valida o email, gera PKCE, chama o resend
  e devolve o verifier **sempre** — exceto serviço fora do ar ou limite de envios, que sobem
  como erro (RN4: resposta neutra não mente quando o serviço caiu).
- Novos códigos de erro em `SignUpConfirmationErrors` (`signup_link_invalid`).

### T3 — Api (rotas e cookie)
- `AuthController.SignUp`: com verifier ⇒ `AuthFlowCookies.WriteSignupVerifier` + 201; com
  sessão ⇒ comportamento atual (cookies de sessão + 201).
- `AuthController.ResendSignUpConfirmation`: `POST /api/auth/sign-up/resend`, `[AllowAnonymous]`
  + `[EnableRateLimiting(Auth)]`, corpo `{ email }`. Sucesso ⇒ verifier no cookie + 202.
- `AuthCallbackController.ConfirmSignUp`: `GET /auth/confirmar-cadastro`, lê `?code=`, consome o
  verifier (limpa o cookie, dê certo ou não), troca, grava sessão e redireciona:
  sucesso ⇒ `/painel`; falha ⇒ `/entrar?erro=confirmacao`.
- `AuthFlowCookies`: `velos_signup` com protector **próprio** `"Velos.Signup.Pkce"` (o do reset é
  `"Velos.PasswordReset.Pkce"` e o do Google `"Velos.Google.Pkce"`), lifetime 1 h (o mesmo do
  link), path `/`, httpOnly. Sem isso, um código de cadastro poderia ser trocado no fluxo de
  redefinição e vice-versa.
- O login já mapeia `email_not_confirmed` ⇒ `AuthErrors.EmailNotConfirmed` (pronto desde a
  spec 001) — nada a fazer além do front.

### Testes
- Unitários: `SignUpHandler` (confirm ligado ⇒ verifier sem sessão; desligado ⇒ sessão);
  `ConfirmSignUpHandler` (sem code/verifier, Supabase recusa ⇒ `signup_link_invalid`);
  `RequestSignUpConfirmationHandler` (sucesso neutro sempre; fora do ar ⇒ erro);
  `AuthFlowCookies` (verifier do cadastro não vale no propósito do reset e vice-versa).
- Api: 201 + cookie `velos_signup` no cadastro; 202 neutro no reenvio; redirects
  `/painel` e `/entrar?erro=confirmacao`; limite por IP aplicado nas rotas novas.
- Integração (máquina com user-secrets): cadastro dispara email (auth logs), resend dispara,
  e a troca do código com o verifier cria sessão. **Risco do T1 é provado aqui.**

## Front (web)

### T4 — Fluxo do usuário
- `features/auth/api.ts`: `resendSignUpConfirmation(email)`.
- `SignUpForm`: trata `confirmation_required` — em vez de navegar, entra no estado de sucesso
  (na própria página): "Enviamos um link para **{email}**", aviso de spam, botão "Reenviar
  email" (com estado "Enviado de novo!"), link "Já confirmou? Entrar". Sessão direta (dev com
  a flag desligada) segue navegando para o painel como hoje.
- `SignInForm`: erro `email_not_confirmed` vira mensagem com ação — "Confirme seu email antes
  de entrar" + botão "Reenviar email de confirmação" (usa o email digitado).
- `SignInPage`: aceita `?erro=confirmacao` e mostra o alerta "Este link não é mais válido.
  Peça outro." (mesmo padrão do `ForgotPasswordForm` com `?erro=link`).
- Estados: skeleton/ocupado, erro e sucesso em 375 px e nos dois temas; anúncios com
  `role="status"`/`role="alert"`.

### T5 — Template do email + painel (passos do Pedro)
- `supabase/templates/confirmation.html`: trocar o link `{{ .SiteURL }}/auth/confirm?token_hash=…`
  por `{{ .ConfirmationURL }}` (4 ocorrências, como no `recovery.html`); remover a nota
  "GUARDADO, NÃO ATIVAR"; conferir com `npm run preview:emails`.
- **Pedro no painel do Supabase:**
  1. *Authentication → Providers → Email*: ligar **Confirm email**.
  2. *Authentication → URL Configuration → Redirect URLs*: adicionar
     `https://veloswallet.com.br/auth/confirmar-cadastro` (e `http://localhost:5080/auth/confirmar-cadastro`
     para o dev).
  3. *Authentication → Emails → Confirm signup*: colar o `confirmation.html` novo, assunto
     "Confirme seu cadastro no Velos Wallet" (igual ao C3 da redefinição).

## E2E (spec 009/012, ADR 0022)

- `helpers.ts`: novo `signInExisting(page)` que lê `E2E_EMAIL`/`E2E_PASSWORD` (env, nunca no
  repo) e falha com mensagem clara se faltarem; `signUp` sai do roteiro `probe`.
- `simulation.spec.ts`: troca o cadastro pelo `signInExisting`. A conta de teste é criada e
  confirmada **uma vez** pelo Pedro (clique no link), e fica para as execuções.
- Novo `web/e2e/confirmacao.spec.ts` (projeto `readonly`? não — mexe em dados): entra com a
  conta de teste, garante que ela está confirmada (login funciona). O ciclo completo do email
  (caixa de entrada, clique no link) é manual, como o T9 da redefinição foi.

## Riscos

| Risco | Mitigação |
|---|---|
| GoTrue ignorar PKCE no `resend` | Provar no teste de integração antes do front; fallback documentado no T1; voltar ao Pedro se persistir |
| Cadastros feitos entre o deploy e o ligar da flag | Nenhum: a flag só liga **depois** do deploy, e a API trata os dois modos |
| Alguém já logado no deploy | A mudança não toca sessões existentes; contas atuais já são "confirmed" no Supabase |
| E2E `probe` sem as env vars | Falha cedo com instrução clara (mensagem no erro do teste) |

## Fora deste plano

Migration, biblioteca nova, mudança no Google OAuth, troca de email, limpeza de cadastros não
confirmados (ver a spec).
