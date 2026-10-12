# Tasks — Spec 001: Autenticação

> Passos pequenos e verificáveis, derivados do [plan.md](plan.md). Cada bloco termina num commit **proposto e aprovado pelo Pedro**.
> Ao terminar cada task: parar, mostrar e esperar aprovação.

**Branch:** `devpedro`

## Feito antes da troca de stack

- [x] **T0** — Spec e plano aprovados (2026-10-12)
- [x] **T1** — Migration `0005_login_attempts.sql` (tabela sem acesso direto + 3 funções + grants)
- [x] **T2** — Migration `0006_storage_brand.sql` (bucket público `brand`)
- [x] **T3** — Aplicar (`db push`) e gerar os tipos
- [x] **T4** — C1 e C2 no painel do Supabase (2026-10-12)
- [x] ~~**T5–T9**~~ — Dependências, validações, middleware, Server Actions e route handlers **no Next.js**. **Substituídas** pela Revisão 2 do plano ([ADR 0013](../../adr/0013-api-aspnet-e-front-react-vite.md)); o que dá para reaproveitar (Zod, casos de teste, componentes) migra na T10

## Revisão 2 — nova stack

### Base
- [x] **T10** — Front em `web/` (Vite + React + TS + Tailwind v4 + shadcn): copiar tokens, `button`/`card`/`input`/`label`, `ThemeToggle`, `currency.ts`, `date.ts`, Zod de auth; script de tema no `index.html`; remover o Next (`src/`, configs); `package.json` da raiz só com a CLI do Supabase
  - Verificação: `typecheck`, `lint` e `build` do `web`; página provisória mostra os tokens nos dois temas sem flash; `npx supabase migration list` continua funcionando
- [x] **T11** — Solution `api/` (Domain, Application, Infrastructure, Api + 2 projetos de teste), `Directory.Build.props`, `Program.cs` com `FallbackPolicy`, `ProblemDetails`, `no-store`, `/api/health` e servir o SPA; proxy do Vite
  - Verificação: `dotnet build api` sem warnings; `dotnet test api`; `http://localhost:3000/api/health` → 200; `/api/me` → 401
- [ ] **T12** — Atualizar os subagentes `designer`, `qa` e `security` (`.claude/agents/`) para a nova stack
  - Verificação: nenhuma menção a Server Actions, `@supabase/ssr` ou `npm run build` na raiz

### Banco pela API
- [ ] **T13** — Migration `0007_api_role.sql` → `db push` (**com aprovação**) → C7 (senha pelo Pedro + `dotnet user-secrets`) → `VelosDbContext` + `UserDbSession`
  - Verificação: conectado como `velos_api` sem `set role` → erro de permissão; como `anon` → `profiles` vazio; com os claims do Pedro → só o perfil dele

### Autenticação
- [ ] **T14** — Domain + Application: `PasswordPolicy`, `SafeRedirect`, validators, interfaces e handlers de auth + testes xUnit (os 31 casos da T6 e as 8 tentativas de open redirect)
  - Verificação: `dotnet test api`
- [ ] **T15** — Infrastructure + Api: `SupabaseAuthClient`, `LoginLockoutStore`, `ProfileReader`; `AuthController` (sign-up, sign-in, sign-out), `MeController`, cookies, renovação do token e header CSRF; `Velos.Api.http`
  - Verificação: pelo `.http`: cadastro real **uma única vez** (cota de emails), login, `/api/me`, sair; POST sem `X-Velos-Csrf` → 400
- [ ] **T16** — Telas `/entrar`, `/cadastro`, `/painel` (provisório) + "Sair", `RequireAuth`, `GuestOnly`, cliente `fetch`
  - Verificação: CA1, CA3, CA4, CA8, CA10, CA11, CA12, CA13, CA17
- [ ] **T17** — Bloqueio de tentativas na tela (avisos e tela de bloqueado)
  - Verificação: CA14, CA15

### Emails, recuperação e Google
- [ ] **T18** — Modelos `supabase/templates/*.html` + C3 (só o de redefinição) + C6 (logo no bucket)
  - Verificação: CA16 (Gmail web/celular e Outlook)
- [ ] **T19** — Recuperação: `/api/auth/password-reset`, `/auth/confirm`, `PUT /api/auth/password`, telas `/recuperar-senha` e `/redefinir-senha`
  - Verificação: CA7 (o mesmo link não funciona duas vezes; sem o cookie de recuperação, `PUT /api/auth/password` → 403)
- [ ] **T20** — Google: `/api/auth/google`, `/auth/callback`, tela `/auth/erro` + C4/C5 com guia
  - Verificação: CA6, CA9

### Fechamento
- [ ] **T21** — ADRs 0014 (bloqueio de tentativas) e 0015 (rotas privadas por padrão)
- [ ] **T22** — Rodar todos os critérios de aceite em 375 e 1440 px, temas claro e escuro
- [ ] **T23** — Agentes `security` (CA-seg) e `qa` (CA-a11y, CA-build)
- [ ] **T24** — `dotnet build api`, `dotnet test api`, `typecheck`, `lint` e `build` do `web`
- [ ] **T25** — Atualizar ROADMAP (Etapa 3 ✅; pré-requisitos do deploy: host em São Paulo, Resend + domínio **e religar a confirmação de email**; spec 002 como próxima), CHANGELOG, LICOES (inclui as lições guardadas da sessão anterior), ARQUITETURA
- [ ] **T26** — Commits finais + PR para `main`

## Registro

| Task | Commit | Observação |
|---|---|---|
| T0 | `927d33d` | spec + plan + tasks |
| T1–T3 | `544a4e8` | Aplicadas em 2026-10-12. Teste anônimo: tabela negada; 5 falhas → bloqueio de 10 min; email normalizado (maiúsculas/espaços); `clear` e `login_email_hash` negados sem login; bucket `brand` existe |
| T5–T9 | `e447a12`…`3520782` | Feitas no Next.js e substituídas pela Revisão 2. Lições que continuam valendo: o `input` do shadcn tem 32 px (usar `h-11`, 44 px); bloqueio com **falha fechada**; `/redefinir-senha` exige cookie de recuperação **ligado ao usuário** (senão uma sessão aberta troca a senha sem saber a atual) |
| T10 | | Vite 8.3, React 19.3, TS 6.0 (o `typescript-eslint` ainda não suporta o TS 7), Tailwind 4.3, ESLint 10. Arquivos movidos com `git mv` (histórico preservado). `ThemeToggle` lê o tema no estado inicial (sem `useEffect`: num SPA não há render no servidor). Regex de símbolos simplificada e conferida: idêntica à anterior, reconhece os 31 símbolos e recusa `ç`. Verificado em 375 px nos dois temas, sem flash e sem erro no console. `npx supabase migration list`: 0001–0006 sincronizadas |
| T11 | | .NET SDK 10.0.300, `Velos.slnx`, Controllers, JwtBearer 10.0.12, xUnit 2.9.3 (template do SDK). `TreatWarningsAsErrors` + `AnalysisLevel latest-recommended`; CA1707 desligada só em `tests/` (nomes com sublinhado). 3 testes de arquitetura (Domain sem referências; Application sem Infrastructure/Api). Verificado: `/api/health` 200; `/api/me` e `/api/nao-existe` sem sessão → 401 ProblemDetails (não revela quais rotas existem); token forjado → 401 `invalid_token` (chave pública buscada no Discovery); `no-store` em `/api` e `/auth`; pelo proxy do Vite idem. Modo produção com o build em `wwwroot`: `/`, `/entrar`, `/painel/...` → `index.html`; estáticos servidos; `/api/*` nunca cai no SPA |
