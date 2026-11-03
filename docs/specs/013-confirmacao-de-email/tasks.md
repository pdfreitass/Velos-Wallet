# Tasks — Spec 013: Confirmação de email no cadastro

> Passos pequenos e verificáveis, a partir do [plan.md](plan.md). Só marcar `[x]` depois de verificar.
> Uma task por vez. Ao terminar cada uma: parar, mostrar, e só então seguir.
> `dotnet build api`, `dotnet test api`, `typecheck`, `lint`, `test` e `build` do `web` passam antes de fechar qualquer task de código.

## Back

### T1 — Cliente Supabase com PKCE e resend
`api/src/Velos.Infrastructure/Supabase/SupabaseAuthClient.cs`

- `SignUpAsync(name, email, password, codeChallenge, redirectTo)` → `signup?redirect_to=…` com `code_challenge`/`code_challenge_method` no corpo.
- Novo `SendSignupConfirmationAsync(email, codeChallenge, redirectTo)` → `POST resend` com `type=signup`.
- Mapeamentos existentes ficam: resposta sem sessão no cadastro → `ConfirmationRequired`; `email_not_confirmed` → `EmailNotConfirmed`.
- Teste de unidade não cobre HTTP real; a prova é o teste de integração (T3-bis).

**Pronto quando:** compila e os testes existentes continuam verdes.

---

### T2 — Application: cadastro, confirmação e reenvio
`api/src/Velos.Application/Auth/`

- `SignUpHandler` devolve `Result<SignUpStarted>` (`AuthSession? Session` + `string? CodeVerifier`); gera `PkcePair` quando a confirmação é exigida.
- Novo `ConfirmSignUpHandler` (molde: `ConfirmPasswordResetHandler`) com `SignUpConfirmationErrors.InvalidLink`.
- Novo `RequestSignUpConfirmationHandler` (molde: `RequestPasswordResetHandler`, resposta neutra RN4).
- Testes: verifier sem sessão / sessão direta; link inválido (sem code, sem verifier, Supabase recusa); reenvio neutro e erro quando o serviço está fora.

**Pronto quando:** testes da `Velos.Application.Tests` cobrem os três handlers.

---

### T3 — Api: rotas, cookie e redirects
`api/src/Velos.Api/Auth/AuthFlowCookies.cs`, `AuthController.cs`, `AuthCallbackController.cs`

- `AuthFlowCookies`: `velos_signup` com protector `"Velos.Signup.Pkce"`, 1 h, httpOnly, path `/`.
- `POST /api/auth/sign-up`: verifier → cookie + 201; sessão → como hoje.
- `POST /api/auth/sign-up/resend` (AllowAnonymous + limite por IP): 202 + verifier no cookie.
- `GET /auth/confirmar-cadastro`: troca o code, grava sessão, `/painel`; falha → `/entrar?erro=confirmacao`; consome o verifier sempre.
- Testes de Api: cookie no cadastro, neutralidade do reenvio, redirects, propósitos separados (verifier do cadastro não vale no reset e vice-versa).

**Pronto quando:** testes da `Velos.Api.Tests` verdes e a rota responde 401/limite conforme o caso.

---

### T3-bis — Prova de integração (máquina com user-secrets)
- Cadastro com a flag ligada dispara email (auth logs do Supabase) e devolve verifier, sem sessão.
- Resend dispara email novo.
- Troca do `code` com o verifier cria sessão.

**Pronto quando:** rodar localmente com user-secrets — se o Pedro não tiver as credenciais aqui, marcar "a provar no deploy" e seguir.

## Front

### T4 — Telas do fluxo
`web/src/features/auth/`

- `api.ts`: `resendSignUpConfirmation(email)`.
- `SignUpForm`: estado de sucesso "Enviamos um link para **{email}**" + spam + "Reenviar email" (com feedback) + "Já confirmou? Entrar".
- `SignInForm`: `email_not_confirmed` → mensagem + botão de reenviar.
- `SignInPage`: `?erro=confirmacao` → "Este link não é mais válido. Peça outro."
- 375 px, dois temas, `role=status`/`role=alert`.

**Pronto quando:** typecheck/lint/test/build verdes; estados vistos à mão (dev com a flag desligada mostra o caminho da sessão direta).

---

### T5 — Template do email + passos do Pedro no painel
`supabase/templates/confirmation.html`

- Link → `{{ .ConfirmationURL }}` (4 ocorrências); remover a nota "GUARDADO, NÃO ATIVAR"; `npm run preview:emails`.
- **Pedro no painel:** ligar *Confirm email*; adicionar as redirect URLs de produção e dev; publicar o modelo na aba *Confirm signup*.

**Pronto quando:** preview renderiza e o Pedro publica (registrar o horário).

---

### T6 — E2E
`web/e2e/`

- `helpers.ts`: `signInExisting(page)` com `E2E_EMAIL`/`E2E_PASSWORD` (env) e erro claro se faltarem.
- `simulation.spec.ts`: cadastro sai; entra com a conta confirmada.
- `probe` roda completo contra a produção depois do deploy.

**Pronto quando:** `probe` verde contra a produção (após o deploy) e `readonly` verde.

---

## Fecho

### T7 — Bateria completa e revisões
- `dotnet build api`, `dotnet test api`, `typecheck`, `lint`, `test` e `build` do `web`; E2E `readonly` no CI.
- Revisão `security`/`qa` do fluxo (cookies, propósitos, neutralidade, limites).

### T8 — Documentação
- ROADMAP (C1 sai da lista), CHANGELOG, LICOES, spec 013 como Concluída.
- Commit em Conventional Commits e PR/deploy conforme o fluxo do dia.
