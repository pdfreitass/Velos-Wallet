# Plano técnico — Spec 001: Autenticação

- **Status:** Aprovado (2026-10-12)
- **Spec:** [spec.md](spec.md) (Aprovada em 2026-10-12)

## Resumo da abordagem

Autenticação 100% pelo **Supabase Auth** via `@supabase/ssr` (cookies), com o **middleware** decidindo o acesso a cada request no modelo **"tudo é privado, exceto uma lista de rotas públicas"**. Formulários com **React Hook Form + Zod** no client e **Server Actions** que revalidam com o **mesmo schema** no servidor. Links de email e Google voltam por **route handlers** em `src/app/auth/`. O **bloqueio de tentativas** vive no Postgres (tabela + funções), acionado pelas Server Actions.

## Configuração fora do código (guiada, feita pelo Pedro)

| # | Onde | O quê |
|---|---|---|
| C1 | Supabase → Authentication → Sign In / Providers → **Email** | *Confirm email* **ligado**; *Minimum password length* = **8**; *Password requirements* = **"Lowercase, uppercase letters, digits and symbols"** |
| C2 | Supabase → Authentication → **URL Configuration** | *Site URL* = `http://localhost:3000`; *Redirect URLs* += `http://localhost:3000/**` |
| C3 | Supabase → Authentication → **Email Templates** | Colar os 2 modelos de `supabase/templates/` (HTML + assunto) |
| C4 | **Google Cloud Console** | Projeto "Velos Wallet" → tela de consentimento (externo, nome Velos Wallet) → credencial *OAuth client ID* (Web) com *Authorized redirect URI* = `https://khvottmyspapwsdeqqnm.supabase.co/auth/v1/callback` |
| C5 | Supabase → Authentication → Providers → **Google** | Ligar e colar **Client ID** e **Client Secret** (direto no painel, **nunca** no chat/código) |
| C6 | Supabase → **Storage** → bucket `brand` | Enviar `velos-claro.png` (logo dos emails precisa de URL pública) |

## Banco de dados

### Migration `0005_login_attempts.sql`

```sql
create table public.login_attempts (
  email_hash   text primary key,          -- sha256(lower(trim(email))): não guarda email em texto
  failed_count int not null default 0,
  locked_until timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.login_attempts enable row level security;
-- SEM policies: ninguém lê/escreve a tabela diretamente. Só as funções abaixo.
create trigger login_attempts_set_updated_at before update ...;
```

Funções `security definer`, `set search_path = ''`:

| Função | Quem pode chamar | O que faz |
|---|---|---|
| `login_lock_status(p_email)` → `(locked_until, failed_count)` | `anon`, `authenticated` | Consulta o estado (se o bloqueio já expirou, devolve zerado) |
| `register_login_failure(p_email)` → `(locked_until, failed_count)` | `anon`, `authenticated` | +1 falha; na 5ª, `locked_until = now() + 10 min`. Se um bloqueio antigo expirou, recomeça do zero |
| `clear_my_login_failures()` | só `authenticated` | Zera o registro **do email do próprio usuário logado** (`auth.jwt() ->> 'email'`). Usada após login certo e após redefinir a senha |

`revoke all on function ... from public` antes dos `grant`. **Exceção à regra "toda tabela tem `user_id`"**: os registros existem *antes* do login e para emails sem conta → **ADR 0013**.

**Por que `clear` não aceita email como parâmetro:** se aceitasse, qualquer um zeraria o bloqueio de qualquer email e o bloqueio não serviria para nada. Só quem **provou** ser o dono (logou ou redefiniu a senha) zera o próprio.

### Migration `0006_storage_brand.sql`

Bucket público `brand` (só leitura pública; upload só pelo painel). Serve a logo dos emails.

Depois de aplicar: `npx supabase db push --dry-run` → `npx supabase db push` → `npm run types:db`.

## Arquivos

| Ação | Caminho | Responsabilidade |
|---|---|---|
| criar | `src/lib/validations/auth.ts` | `passwordSchema` (RN1, com o **mesmo conjunto de símbolos do Supabase**), `signUpSchema` (nome, email, senha, confirmação — RN2), `signInSchema`, `emailSchema`, `resetPasswordSchema`, e a lista `PASSWORD_REQUIREMENTS` usada pelo checklist da tela |
| criar | `src/lib/utils/redirect.ts` | `getSafeRedirect(next, fallback = "/painel")` — RN7 |
| criar | `src/lib/auth/routes.ts` | Rotas públicas, de "só deslogado" e destino padrão, num lugar só |
| alterar | `src/lib/env.ts` + `.env.example` | `NEXT_PUBLIC_SITE_URL` (base dos links de email/Google; nunca o header `Host` da request) |
| alterar | `src/lib/supabase/middleware.ts` | `getUser()` + regras da RN8; chaves obrigatórias (T4); `Cache-Control: no-store` nas rotas privadas (CA11) |
| criar | `src/server/actions/auth.ts` | `signUp`, `signIn`, `signInWithGoogle`, `resendConfirmation`, `requestPasswordReset`, `updatePassword`, `signOut` |
| criar | `src/server/queries/profile.ts` | `getCurrentProfile()` para o "Olá, {nome}" |
| criar | `src/app/auth/confirm/route.ts` | Link do email: `verifyOtp({ token_hash, type })` → `/painel` (cadastro) ou `/redefinir-senha` (recuperação) |
| criar | `src/app/auth/callback/route.ts` | Volta do Google: `exchangeCodeForSession(code)` → `next` seguro |
| criar | `src/app/auth/erro/page.tsx` | Erro amigável |
| criar | `src/app/(auth)/layout.tsx` | Layout centralizado com a logo, para as telas de entrada |
| criar | `src/app/(auth)/entrar/page.tsx` | |
| criar | `src/app/(auth)/cadastro/page.tsx` | |
| criar | `src/app/(auth)/cadastro/verifique-email/page.tsx` | |
| criar | `src/app/(auth)/recuperar-senha/page.tsx` | |
| criar | `src/app/(auth)/redefinir-senha/page.tsx` | Exige a sessão de recuperação |
| criar | `src/app/(app)/layout.tsx` | Segunda barreira: `getUser()` e `redirect("/entrar")` se não houver sessão |
| criar | `src/app/(app)/painel/page.tsx` | "Olá, {nome}" + Sair (provisório) |
| alterar | `src/app/page.tsx` | Deixa de ser a página de validação: redireciona conforme a sessão (RN8) |
| alterar | `src/app/layout.tsx` | Metadata com acento (T3) |
| criar | `src/components/features/auth/*` | `SignInForm`, `SignUpForm`, `ForgotPasswordForm`, `ResetPasswordForm`, `PasswordInput` (mostrar/ocultar), `PasswordRequirements` (✓/✗ + texto), `GoogleButton`, `SignOutButton`, `ResendConfirmationButton`, `FormMessage` (erro com `aria-live`) — cada um < 150 linhas |
| adicionar (CLI shadcn) | `src/components/ui/input.tsx`, `label.tsx` | Primitivos de formulário |
| criar | `supabase/templates/confirmacao-cadastro.html` | Email de confirmação (C3) |
| criar | `supabase/templates/redefinicao-senha.html` | Email de redefinição (C3) |
| criar | `docs/adr/0013-bloqueio-de-tentativas-de-login.md` | Decisão + limite conhecido |
| criar | `docs/adr/0014-rotas-privadas-por-padrao.md` | Middleware *default-deny* + rotas em português |

## Fluxo de dados

### Login (com bloqueio)

```
SignInForm (RHF + zodResolver)
  └─ signIn(formData)  [Server Action]
       ├─ signInSchema.parse()                                  ← nunca confia no client
       ├─ rpc login_lock_status(email) ── bloqueado? ──► { status: "locked", minutesLeft }
       ├─ auth.signInWithPassword()
       │    ├─ invalid_credentials ─► rpc register_login_failure(email)
       │    │                          └─► { status: "invalid", attemptsLeft }  (aviso a partir da 3ª)
       │    ├─ email_not_confirmed ─► { status: "unconfirmed" }  (não conta como falha)
       │    └─ ok ─► rpc clear_my_login_failures() ─► redirect(getSafeRedirect(next))
```

### Cadastro → confirmação

```
signUp → auth.signUp({ email, password, options: { data: { full_name }, emailRedirectTo } })
       → sempre redirect("/cadastro/verifique-email?email=…")   ← mesmo se o email já existir (RN4)
email  → {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/painel
       → route handler: verifyOtp() → cookies de sessão → /painel
banco  → trigger handle_new_user já criou profile + 10 categorias (RN9, RN10)
```

### Esqueci a senha → redefinir

```
requestPasswordReset → auth.resetPasswordForEmail(email)  → sempre a mensagem neutra (RN4)
email  → /auth/confirm?token_hash=…&type=recovery&next=/redefinir-senha
       → verifyOtp() cria sessão de recuperação → /redefinir-senha
updatePassword → schema (RN1 + RN2) → auth.updateUser({ password })
       → rpc clear_my_login_failures() (libera bloqueio) → /painel
```

### Google

```
GoogleButton → signInWithGoogle(next) → auth.signInWithOAuth({ provider: "google",
               redirectTo: SITE_URL/auth/callback?next=… }) → redirect(data.url)
Google → Supabase → /auth/callback?code=… → exchangeCodeForSession → getSafeRedirect(next)
```

### Middleware (toda request)

```
updateSession → getUser()
  ├─ rota pública (/entrar, /cadastro/**, /recuperar-senha, /auth/**)
  │    └─ logado em /entrar ou /cadastro → /painel
  ├─ "/" → /painel ou /entrar
  └─ qualquer outra rota sem usuário → /entrar?next=<rota>   ← default-deny: rota nova já nasce protegida
```

## Validação

| Regra | Formulário (Zod no client) | Server Action (mesmo Zod) | Supabase / banco |
|---|---|---|---|
| Senha forte (RN1) | ✓ checklist ao vivo | ✓ | ✓ C1 (barreira final, vale até para quem chama a API direto) |
| Senha = confirmação (RN2) | ✓ | ✓ | — |
| Email válido | ✓ | ✓ | ✓ |
| Nome 2–80 caracteres | ✓ | ✓ | ✓ CHECK `length(trim(name)) > 0` |
| Bloqueio (RN5) | — | ✓ RPC | ✓ funções + tabela sem acesso direto |
| Redirect seguro (RN7) | — | ✓ `getSafeRedirect` | ✓ Redirect URLs (C2) |

Mensagens de erro em pt-BR no próprio schema. Erros do Supabase **nunca** são repassados crus: são mapeados para as mensagens da spec.

## Dependências novas

| Pacote | Motivo |
|---|---|
| `zod@^4` | Validação com **um schema só** para client e servidor (já previsto no CLAUDE.md) |
| `react-hook-form@^7` | Formulários com erro por campo e checklist de senha ao vivo sem re-render da página toda |
| `@hookform/resolvers@^5` | Liga o Zod ao React Hook Form (`zodResolver`), compatível com Zod 4 |

Componentes `input` e `label` vêm do **CLI do shadcn** (código copiado para o repo, não é dependência).

## Decisões (ADRs novas)

- **ADR 0013 — Bloqueio de tentativas no app.** Tabela + funções no Postgres. **Limite conhecido:** protege o login feito pelo app; quem chamar a API de Auth do Supabase direto, com a chave publicável, não passa pelas Server Actions. Mitigações: limite de tentativas **por IP** do próprio Supabase, senha forte imposta pelo Supabase (C1) e, no futuro, CAPTCHA (Turnstile/hCaptcha, suportado no plano Free) e/ou o *Password Verification Hook* (planos pagos).
- **ADR 0014 — Rotas privadas por padrão.** O middleware só libera uma lista explícita de rotas públicas; o layout de `(app)` repete a checagem (defesa em profundidade).

## Riscos e armadilhas

- **Limite de emails do Supabase:** o servidor padrão manda poucos emails por hora e só para membros do projeto. Testar com calma: reenvios repetidos vão bater no limite (e o erro precisa aparecer como "limite de envios atingido").
- **`getUser()`, nunca `getSession()`, no servidor:** o `getSession()` confia no cookie sem revalidar o token.
- **Símbolos da senha:** o Zod usa exatamente o conjunto do Supabase (`!@#$%^&*()_+-=[]{};':"|<>?,./\`~`). Com `[^A-Za-z0-9]`, um "ç" passaria no app e seria recusado pelo Supabase.
- **Botão "voltar" após sair (CA11):** o navegador pode mostrar a página do cache. O `Cache-Control: no-store` nas rotas privadas evita isso.
- **Logo no email:** Gmail e Outlook não carregam SVG nem imagens embutidas em base64 de forma confiável, por isso PNG numa URL pública (C6), com `alt="Velos Wallet"` e largura fixa.
- **Email em modo escuro:** alguns clientes invertem cores; layout com fundo claro explícito e logo com fundo próprio.
- **Datas/dinheiro:** não se aplicam nesta etapa.

## Como testar

- **Manual:** um roteiro por critério de aceite (CA1–CA16) no `tasks.md`, executado no Chrome/Playwright em 375 e 1440 px, nos dois temas.
- **Bloqueio (CA14/CA15):** 5 senhas erradas → bloqueio; conferir a linha em `login_attempts` (só o hash); 6ª com a senha certa recusada; redefinir senha libera.
- **RLS:** com a chave publicável e sem sessão, `select` em `login_attempts` devolve `[]`/erro; `clear_my_login_failures()` sem sessão falha.
- **Open redirect (CA9):** `/entrar?next=https://exemplo.com` e `?next=//exemplo.com` → `/painel`.
- **Agentes:** `security` (CA-seg) e `qa` (CA-a11y, CA-build) no fim.
- `npm run typecheck && npm run lint && npm run build`.
