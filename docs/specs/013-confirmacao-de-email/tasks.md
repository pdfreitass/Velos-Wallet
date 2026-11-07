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

### T3-bis — Prova de integração (máquina com user-secrets)
- Cadastro com a flag ligada dispara email (auth logs do Supabase) e devolve verifier, sem sessão.
- Resend dispara email novo.
- Troca do `code` com o verifier cria sessão.

**Pronto quando:** rodar localmente com user-secrets — se o Pedro não tiver as credenciais aqui, marcar "a provar no deploy" e seguir.

**Estado (2026-11-03):** a provar no deploy. A máquina TEM os user-secrets, mas a flag *Confirm email* está desligada na produção e **só pode ser ligada depois do deploy** do código novo (T1–T3) — ligar antes quebraria os cadastros no ar, que ainda rodam o código antigo. Com a flag desligada o reenvio não dispara email de verdade, então o risco do T1 (GoTrue ignorar o PKCE no resend) não é provável agora. A prova roda no fecho, contra a produção, junto da T5/T6.

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
