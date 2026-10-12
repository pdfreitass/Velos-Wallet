# Tasks — Spec 001: Autenticação

> Passos pequenos e verificáveis, derivados do [plan.md](plan.md). Cada bloco termina num commit **proposto e aprovado pelo Pedro**.
> Ao terminar cada task: parar, mostrar e esperar aprovação.

**Branch:** `devpedro`

## Preparação
- [x] **T0** — Spec e plano aprovados (2026-10-12)

## Banco
- [x] **T1** — Migration `0005_login_attempts.sql` (tabela sem acesso direto + 3 funções + grants)
  - Verificação: `npx supabase db push --dry-run` lista só 0005 e 0006
- [x] **T2** — Migration `0006_storage_brand.sql` (bucket público `brand`)
- [x] **T3** — Aplicar (`db push`, **com aprovação**) e `npm run types:db`
  - Verificação: `migration list` sincronizado; `login_attempts` e as 3 funções aparecem nos tipos; sem sessão, `select` em `login_attempts` não devolve nada e `clear_my_login_failures()` falha

## Configuração (Pedro, com guia)
- [ ] **T4** — C1 (regras de senha; **Confirm email desligado** — Revisão 1) e C2 (Site URL, Redirect URLs) no painel do Supabase
  - Verificação: na Task 10, um único cadastro real (não testar senha pela API de cadastro: gasta a cota de emails)

## Base do código
- [x] **T5** — Instalar `zod`, `react-hook-form`, `@hookform/resolvers`; adicionar `input` e `label` pelo CLI do shadcn
  - Verificação: `npm run typecheck`
- [x] **T6** — `lib/validations/auth.ts`, `lib/utils/redirect.ts`, `lib/auth/routes.ts`, `NEXT_PUBLIC_SITE_URL` em `env.ts`/`.env.example`
  - Verificação: senha `Pedro10@` válida; `pedro10@`, `Pedro10a`, `Pedro@ab`, `Pe10@` inválidas (cada uma por um motivo); `getSafeRedirect("//x.com")` → `/painel`
- [x] **T7** — Middleware (RN8, default-deny, T4 do ROADMAP, `no-store`), `(app)/layout.tsx`, `/` redirecionando, metadata com acento (T3 do ROADMAP)
  - Verificação: sem sessão, `/painel` e `/qualquer-coisa` → `/entrar?next=…`

## Fluxos
- [x] **T8** — Server Actions (`server/actions/auth.ts`, `server/actions/password.ts`) + `server/queries/profile.ts`
  - Teste funcional junto com as telas (T10–T12): Server Actions dependem de cookies da request
- [ ] **T9** — Route handlers `auth/confirm`, `auth/callback` + página `auth/erro`
- [ ] **T10** — Telas `/entrar` e `/cadastro` + componentes de formulário (`/cadastro/verifique-email` adiada — Revisão 1)
  - Verificação: CA1, CA3, CA4, CA12, CA13, CA17
- [ ] **T11** — Telas `/recuperar-senha`, `/redefinir-senha`, `/painel` + "Sair"
  - Verificação: CA7, CA8, CA10, CA11
- [ ] **T12** — Bloqueio de tentativas ligado ao login (avisos e tela de bloqueado)
  - Verificação: CA14, CA15

## Emails e Google
- [ ] **T13** — Modelos `supabase/templates/*.html` (formais, com logo) + C3 (colar **só o de redefinição** no painel; o de confirmação fica guardado) + C6 (logo no bucket)
  - Verificação: CA16 (Gmail web/celular e Outlook)
- [ ] **T14** — Google: C4 (Google Cloud) + C5 (Supabase) com guia
  - Verificação: CA6, CA9

## Fechamento
- [ ] **T15** — ADRs 0013 (bloqueio de tentativas) e 0014 (rotas privadas por padrão)
- [ ] **T16** — Rodar todos os critérios de aceite em 375 e 1440 px, temas claro e escuro
- [ ] **T17** — Agentes `security` (CA-seg) e `qa` (CA-a11y, CA-build)
- [ ] **T18** — `npm run typecheck`, `npm run lint`, `npm run build`
- [ ] **T19** — Atualizar ROADMAP (Etapa 3 ✅, T3/T4 resolvidas; pré-requisitos do deploy: Resend + domínio **e religar a confirmação de email**; spec 002 — Completar perfil — como próxima), CHANGELOG, LICOES, ARQUITETURA
- [ ] **T20** — Commits finais + PR para `main`

## Registro

| Task | Commit | Observação |
|---|---|---|
| T0 | `927d33d` | spec + plan + tasks |
| T1–T3 | `544a4e8` | Aplicadas em 2026-10-12. Teste anônimo: tabela negada; 5 falhas → bloqueio de 10 min; email normalizado (maiúsculas/espaços); `clear` e `login_email_hash` negados sem login; bucket `brand` existe |
| T5 | `e447a12` | zod 4.6.6, react-hook-form 7.90.0, @hookform/resolvers 5.9.1; shadcn input + label. `input` do shadcn tem 32 px de altura: nos formulários usar `h-11` (44 px, alvo de toque) |
| T6 | `a54c172` | 31 casos testados (senhas válidas/inválidas por motivo, normalização de email, senhas diferentes, 8 tentativas de open redirect, rotas públicas/privadas) |
| T7 | `39911ff` | Sem sessão: `/` → `/entrar`; `/painel`, `/transacoes?mes=…`, `/qualquer-coisa`, `/redefinir-senha`, `/cadastros` → `/entrar?next=…` (query preservada); rotas públicas passam. Redirecionamentos levam os cookies renovados. `hasSupabaseEnv` removido (chaves obrigatórias) |
| T8 | | Bloqueio com falha fechada (sem consultar o bloqueio, não tenta entrar). `/redefinir-senha` exige o cookie `velos_pw_reset` ligado ao usuário (gravado só pelo link de recuperação) — sem ele, uma sessão aberta trocaria a senha sem saber a atual |
