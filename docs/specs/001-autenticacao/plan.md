# Plano técnico — Spec 001: Autenticação

- **Status:** **Revisão 2 aprovada** (2026-10-12) · Revisão original aprovada em 2026-10-12
- **Spec:** [spec.md](spec.md) (Aprovada em 2026-10-12)

> **Revisão 2 (2026-10-12): troca de stack** ([ADR 0013](../../adr/0013-api-aspnet-e-front-react-vite.md)). O Next.js sai; entram uma **API ASP.NET Core (.NET 10, Clean Architecture)** e um **front React + Vite**. **O comportamento da spec não muda**: as mesmas telas, regras e critérios de aceite. Muda o *como*. O plano anterior (Next + `@supabase/ssr` + Server Actions) está no histórico do git (`927d33d`).
>
> **Revisão 1 (continua valendo):** *Confirm email* desligado; sem `/cadastro/verifique-email`; cadastro entra direto em `/painel`; email já cadastrado → mensagem própria (CA17); só o modelo de redefinição vai para o painel.

## Resumo da abordagem

O navegador **só conversa com a API**. A API chama o **Supabase Auth pela REST** (GoTrue) com a chave publicável, que fica só no servidor, e guarda a sessão em **cookies `httpOnly`**. Em cada request, a API valida o access token pela **chave pública ES256** do projeto e, para ler ou gravar dados, abre uma **transação com `role authenticated` + claims do JWT**, de modo que a RLS da Etapa 2 continua valendo. O **bloqueio de tentativas** (migration `0005`) é aplicado pela API antes de chamar o Supabase. Toda rota da API é **privada por padrão**.

## Configuração fora do código (guiada, feita pelo Pedro)

| # | Onde | O quê | Estado |
|---|---|---|---|
| C1 | Supabase → Authentication → **Email** | *Confirm email* **desligado** (Revisão 1); mínimo 8; "Lowercase, uppercase letters, digits and symbols" | ✅ feito |
| C2 | Supabase → Authentication → **URL Configuration** | *Site URL* = `http://localhost:3000`; *Redirect URLs* += `http://localhost:3000/**`. **Não muda**: o Vite roda na porta 3000 | ✅ feito |
| C3 | Supabase → Authentication → **Email Templates** | Colar **só** o modelo de redefinição | ⛔ **adiado** (2026-10-13): o painel exige SMTP próprio para editar modelo. Vai junto com o Resend, antes do deploy |
| C4 | **Google Cloud Console** | OAuth client (Web) com *Authorized redirect URI* = `https://khvottmyspapwsdeqqnm.supabase.co/auth/v1/callback` | ⬜ passo a passo em [guia-google.md](guia-google.md) |
| C5 | Supabase → Providers → **Google** | Client ID e Client Secret direto no painel, nunca no chat/código | ⬜ passo a passo em [guia-google.md](guia-google.md) |
| C6 | Supabase → Storage → bucket `brand` | Enviar `velos-claro.png` | ⬜ |
| **C7** | Supabase → **SQL Editor** (uma vez) + `dotnet user-secrets` | Definir a **senha do role `velos_api`** e gravar a connection string só nos user-secrets. **Exceção única à regra "nunca SQL no Editor"**: senha não pode ir para arquivo versionado | ⬜ **novo** |

## Banco de dados

- `0005_login_attempts.sql` e `0006_storage_brand.sql`: **já aplicadas**, sem mudança. As funções `login_lock_status` e `register_login_failure` são chamadas pela API com `set local role anon`, e `clear_my_login_failures` com `role authenticated` + claims.
- **Nova: `0007_api_role.sql`**

```sql
-- Role de login da API: sem privilégios próprios (noinherit) e sem bypassrls.
-- Só consegue agir depois de "set local role anon|authenticated".
create role velos_api login noinherit nobypassrls;   -- senha definida fora do git (C7)
grant anon, authenticated to velos_api;
```

Conferido em 2026-10-12: o `postgres` tem `createrole` e `admin option` sobre `anon` e `authenticated`, então a migration roda pelo `db push`.

**Conexão:** pelo **pooler de sessão** do Supavisor (`aws-0-sa-east-1.pooler.supabase.com:5432`, usuário `velos_api.khvottmyspapwsdeqqnm`), porque a conexão direta do plano Free é só IPv6. A API é um processo de vida longa, então o modo sessão serve.

### Sessão de banco por request (`UserDbSession`)

```sql
begin;
select set_config('role', 'authenticated', true),               -- true = só nesta transação
       set_config('request.jwt.claims', @claims_json, true);    -- payload do JWT já validado
-- ... queries da request: auth.uid() e as policies funcionam como no Supabase ...
commit;
```

Para as funções de bloqueio, antes do login: `set_config('role', 'anon', true)`. Se o código esquecer a sessão, o `velos_api` (noinherit) **não tem permissão em nada** e a query falha: falha fechada.

## Estrutura

```
api/
  Velos.slnx
  Directory.Build.props            # net10.0, Nullable, TreatWarningsAsErrors, ImplicitUsings
  src/
    Velos.Domain/                  # regras puras, sem dependência: PasswordPolicy
    Velos.Application/             # casos de uso, interfaces, validators, Result
      Abstractions/                # IIdentityProvider, ILoginLockout, IProfileReader, IUserContext
      Auth/                        # SignIn, SignUp, SignOut, RequestPasswordReset, UpdatePassword,
                                   #   ConfirmEmailLink, ExchangeGoogleCode (comando + handler + validator)
      Common/                      # Result<T>, Error, SafeRedirect
    Velos.Infrastructure/
      Supabase/                    # SupabaseAuthClient (HttpClient tipado → GoTrue REST)
      Persistence/                 # VelosDbContext (EF Core, sem migrations), UserDbSession,
                                   #   LoginLockoutStore, ProfileReader
    Velos.Api/
      Controllers/                 # AuthController, AuthLinksController (/auth/*), MeController
      Auth/                        # SessionCookies, TokenRefreshMiddleware, CsrfHeaderMiddleware
      Program.cs                   # JWT (lê do cookie), FallbackPolicy, ProblemDetails, SPA
  tests/
    Velos.Domain.Tests/            # xUnit
    Velos.Application.Tests/       # xUnit (handlers com dublês das interfaces)
web/
  index.html                       # script inline de tema (ADR 0009)
  vite.config.ts                   # porta 3000, proxy /api, /auth/confirm, /auth/callback → API
  src/
    main.tsx, router.tsx           # rotas em português
    styles/globals.css             # tokens (copiados de src/app/globals.css, contrastes mantidos)
    components/ui/                 # button, card, input, label (copiados)
    components/shared/             # ThemeToggle (copiado), RequireAuth, GuestOnly
    features/auth/                 # formulários e componentes das telas
    pages/                         # Entrar, Cadastro, RecuperarSenha, RedefinirSenha, Painel, AuthErro
    lib/api/                       # cliente fetch (credentials, header CSRF, ProblemDetails → erro tipado)
    lib/utils/                     # currency.ts, date.ts (copiados)
    lib/validations/auth.ts        # Zod (copiado da T6): só para a experiência do usuário
supabase/                          # migrations, templates
package.json                       # raiz: só a CLI do Supabase
```

**Sai:** `src/` inteiro do Next, `next.config.ts`, `middleware.ts`, `database.types.ts` e o script `types:db` (o front não acessa mais o banco). **Reaproveitado:** tokens e contrastes, `button`/`card`/`input`/`label`, `ThemeToggle`, `currency.ts`, `date.ts`, schemas Zod e os casos de teste da T6 (portados para xUnit).

## Endpoints

Todas as respostas com `Cache-Control: no-store`. Erros como **`ProblemDetails`** com `code` estável (o front traduz pelo `code`, nunca mostra texto do Supabase).

| Método | Rota | Acesso | O que faz |
|---|---|---|---|
| POST | `/api/auth/sign-up` | anônimo | Cadastro → grava cookies → `201` · `email_taken` (CA17) · `rate_limited` |
| POST | `/api/auth/sign-in` | anônimo | Bloqueio → login → cookies · `invalid_credentials` (+`attemptsLeft` da 3ª em diante) · `locked` (+`minutesLeft`) |
| POST | `/api/auth/sign-out` | logado | `logout` no Supabase (revoga o refresh token) + apaga cookies (RN12) |
| POST | `/api/auth/password-reset` | anônimo | `recover` no Supabase → **sempre `202`** com a mensagem neutra (RN4) · `rate_limited` |
| PUT | `/api/auth/password` | logado + cookie de recuperação | Troca a senha, zera o bloqueio, apaga o cookie de recuperação |
| GET | `/api/auth/google?next=` | anônimo | Gera o PKCE → `302` para o Supabase/Google |
| GET | `/auth/callback?code=&next=` | anônimo | Troca o `code` (PKCE) → cookies → `302` para `SafeRedirect(next)` |
| GET | `/auth/confirm?token_hash=&type=` | anônimo | `verify` no Supabase → cookies (+ cookie de recuperação) → `302 /redefinir-senha` |
| GET | `/api/me` | logado | `{ name, email }` do `profiles` (sob RLS) |
| GET | `/api/health` | anônimo | Só para checar que a API está de pé |

`/auth/callback` e `/auth/confirm` ficam fora de `/api` para os links de email e as Redirect URLs (C2) não mudarem.

## Sessão, cookies e CSRF

| Cookie | Conteúdo | Atributos |
|---|---|---|
| `velos_at` | access token | `HttpOnly; Secure; SameSite=Lax; Path=/`, vida = `expires_in` |
| `velos_rt` | refresh token | `HttpOnly; Secure; SameSite=Lax; Path=/api`, 30 dias |
| `velos_pw_reset` | `userId` + validade, protegido pelo **Data Protection** do ASP.NET | `HttpOnly; Secure; SameSite=Lax`, 15 min |
| `velos_pkce` | `code_verifier`, protegido pelo Data Protection | `HttpOnly; Secure; SameSite=Lax; Path=/auth/callback`, 10 min |

- **Validação do JWT:** `AddJwtBearer` com `Authority = https://khvottmyspapwsdeqqnm.supabase.co/auth/v1` (OpenID Discovery, chave ES256 em cache), `Audience = authenticated`, e o token lido do cookie em `OnMessageReceived`.
- **Renovação:** o `TokenRefreshMiddleware` roda antes da autenticação. Se o `velos_at` falta ou vence em menos de 60 s e existe `velos_rt`, ele chama `grant_type=refresh_token` e regrava os dois cookies.
- **CSRF:** `SameSite=Lax` **e** todo método que não é GET em `/api` exige o header `X-Velos-Csrf: 1`. O cliente `fetch` do front sempre envia esse header; um formulário de outro site não consegue.
- **Rotas privadas por padrão:** `FallbackPolicy = RequireAuthenticatedUser()`; as rotas anônimas acima têm `[AllowAnonymous]` explícito.
- **No front:** `RequireAuth` consulta `/api/me` (401 → `/entrar?next=<rota>`); `GuestOnly` manda quem está logado de `/entrar` e `/cadastro` para `/painel`. É só experiência do usuário: **quem protege os dados é a API**. Depois do "Sair", o cache do front é limpo, então o botão "voltar" volta a consultar `/api/me` e recebe 401 (CA11).

## Fluxo de dados

### Login (com bloqueio)

```
SignInForm (RHF + zodResolver)  ──POST /api/auth/sign-in──►  AuthController
  └─ SignInHandler
       ├─ SignInValidator (FluentValidation)                   ← nunca confia no front
       ├─ ILoginLockout.GetStatus(email)   [role anon] ── bloqueado? ──► locked (minutesLeft)
       │     └─ falhou a consulta? ──► erro, sem tentar o login (falha fechada)
       ├─ IIdentityProvider.SignInWithPassword()   → POST /auth/v1/token?grant_type=password
       │    ├─ invalid_credentials ─► ILoginLockout.RegisterFailure(email) ─► invalid_credentials (attemptsLeft)
       │    └─ ok ─► ILoginLockout.ClearMine() [role authenticated + claims] ─► sessão
  └─ SessionCookies.Write(sessão) ─► 200
```

### Cadastro

```
POST /api/auth/sign-up → POST /auth/v1/signup { email, password, data: { full_name } }
  ├─ user_already_exists ─► email_taken (CA17)
  └─ ok (Confirm email desligado → já vem sessão) ─► cookies ─► front vai para /painel
banco → trigger handle_new_user cria profile + 10 categorias (RN9, RN10)
```

### Esqueci a senha → redefinir

```
POST /api/auth/password-reset → POST /auth/v1/recover → sempre 202 neutro (RN4)
email → {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery   (modelo da C3)
      → POST /auth/v1/verify → cookies + velos_pw_reset(userId) → 302 /redefinir-senha
PUT /api/auth/password → exige velos_pw_reset do MESMO usuário → PUT /auth/v1/user
      → ClearMine() (libera o bloqueio) → apaga velos_pw_reset → front vai para /painel
```

O link de recuperação **depende do modelo da C3** (`token_hash`): o modelo padrão do Supabase devolve o token no `#fragmento` da URL, que o servidor não enxerga. Por isso os modelos de email vêm **antes** das telas de recuperação nas tasks.

### Google

```
GET /api/auth/google?next= → code_verifier → velos_pkce → 302 /auth/v1/authorize?provider=google
     &redirect_to=SITE_URL/auth/callback?next=…&code_challenge=…&code_challenge_method=s256
Google → Supabase → GET /auth/callback?code= → POST /auth/v1/token?grant_type=pkce
     → cookies → 302 SafeRedirect(next)       (erro/cancelado → /auth/erro?motivo=google)
```

## Validação

| Regra | Front (Zod) | API (FluentValidation / handler) | Supabase / banco |
|---|---|---|---|
| Senha forte (RN1) | ✓ checklist ao vivo | ✓ `PasswordPolicy` no Domain | ✓ C1 |
| Senha = confirmação (RN2) | ✓ | ✓ | — |
| Email válido | ✓ | ✓ | ✓ |
| Nome 2–80 caracteres | ✓ | ✓ | ✓ CHECK |
| Bloqueio (RN5) | — | ✓ handler | ✓ funções + tabela sem acesso direto |
| Redirect seguro (RN7) | — | ✓ `SafeRedirect` | ✓ Redirect URLs (C2) |

As regras de senha existem em dois lugares (Zod e C#). Para não divergirem, **os mesmos casos de teste** (os 31 da T6) rodam nos dois lados.

## Dependências novas

**NuGet**

| Pacote | Motivo |
|---|---|
| `Microsoft.AspNetCore.Authentication.JwtBearer` | Validar o JWT do Supabase (oficial da Microsoft) |
| `Npgsql.EntityFrameworkCore.PostgreSQL` | EF Core para o Postgres, **sem migrations**: mapeia tabelas e views |
| `FluentValidation` + `FluentValidation.DependencyInjectionExtensions` | Validação de entrada na `Application` (regra do CLAUDE.md) |
| `xunit` (template `dotnet new xunit`) | Testes de Domain e Application. Sem FluentAssertions (licença comercial desde a v8) e sem MediatR (idem): handlers simples |

**npm (`web/`)**

| Pacote | Motivo |
|---|---|
| `vite`, `@vitejs/plugin-react`, `typescript` | Base do front |
| `react-router` (v7) | Rotas do SPA (`/entrar`, `/painel`…) |
| `@tanstack/react-query` (v5) | Cache das chamadas à API, loading/erro por tela; vira a base das listas nas Etapas 4–7 |
| `@fontsource-variable/geist` | A fonte Geist vinha do `next/font`; agora é servida pelo próprio app |
| (já usados) `tailwindcss`, `@tailwindcss/vite`, `@base-ui/react`, `lucide-react`, `zod`, `react-hook-form`, `@hookform/resolvers`, `date-fns` | Migram do `package.json` atual |

## Decisões (ADRs)

- **0013 — API ASP.NET + React/Vite** (já aceita).
- **0014 — Bloqueio de tentativas** (era a 0013 do plano original). Melhora em relação ao plano anterior: o navegador nem recebe a chave publicável, então contornar o bloqueio exige descobri-la por outro meio. O limite conhecido continua: a chave publicável não é secreta por natureza.
- **0015 — Rotas privadas por padrão** (era a 0014): `FallbackPolicy` na API + `RequireAuth` no front.

## Riscos e armadilhas

- **Cota de emails do Supabase:** nunca testar regras de senha pela API de cadastro (lição da sessão anterior).
- **`Secure` em `http://localhost`:** Chrome e Firefox aceitam cookies `Secure` em localhost; se algum navegador recusar, usar o perfil HTTPS do `dotnet dev-certs`.
- **Pooler + `set_config(..., true)`:** valores locais à transação não vazam para a próxima request que reusar a conexão. **Nunca** usar `set role` sem `local`.
- **Refresh em paralelo:** duas requests podem tentar renovar ao mesmo tempo; o Supabase tolera reuso do refresh token por alguns segundos (*reuse interval*). Testar com duas abas.
- **Access token após "Sair":** continua válido até expirar (ver ADR 0013); os cookies são apagados e o refresh token é revogado.
- **Símbolos da senha:** C# e Zod usam exatamente o conjunto do Supabase (`!@#$%^&*()_+-=[]{};':"|<>?,./\`~`).
- **Logo e modo escuro nos emails:** sem mudança em relação ao plano original (PNG em URL pública, fundo claro explícito).

## Como testar

- **xUnit:** `PasswordPolicy` (os 31 casos da T6), `SafeRedirect` (as 8 tentativas de open redirect), handlers com dublês (bloqueio, falha fechada, mensagens neutras).
- **API:** arquivo `api/src/Velos.Api/Velos.Api.http` com as chamadas de cada endpoint (roda no VS/VS Code).
- **RLS pela API:** sem sessão, `/api/me` → 401; com a sessão do Pedro, só o próprio perfil; conectado como `velos_api` sem `set role`, `select` em `profiles` → erro de permissão.
- **Manual:** cada critério de aceite em 375 e 1440 px, nos dois temas.
- **Agentes:** `security` (CA-seg) e `qa` (CA-a11y, CA-build), depois de atualizados para a nova stack.
- `dotnet build api && dotnet test api` + `typecheck`, `lint` e `build` do `web`.
