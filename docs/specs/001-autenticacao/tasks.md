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
- [ ] **T4** — C1 (regras de senha, confirmar email) e C2 (Site URL, Redirect URLs) no painel do Supabase

## Base do código
- [ ] **T5** — Instalar `zod`, `react-hook-form`, `@hookform/resolvers`; adicionar `input` e `label` pelo CLI do shadcn
  - Verificação: `npm run typecheck`
- [ ] **T6** — `lib/validations/auth.ts`, `lib/utils/redirect.ts`, `lib/auth/routes.ts`, `NEXT_PUBLIC_SITE_URL` em `env.ts`/`.env.example`
  - Verificação: senha `Pedro10@` válida; `pedro10@`, `Pedro10a`, `Pedro@ab`, `Pe10@` inválidas (cada uma por um motivo); `getSafeRedirect("//x.com")` → `/painel`
- [ ] **T7** — Middleware (RN8, default-deny, T4 do ROADMAP, `no-store`), `(app)/layout.tsx`, `/` redirecionando, metadata com acento (T3 do ROADMAP)
  - Verificação: sem sessão, `/painel` e `/qualquer-coisa` → `/entrar?next=…`

## Fluxos
- [ ] **T8** — Server Actions (`server/actions/auth.ts`) + `server/queries/profile.ts`
- [ ] **T9** — Route handlers `auth/confirm`, `auth/callback` + página `auth/erro`
- [ ] **T10** — Telas `/entrar`, `/cadastro`, `/cadastro/verifique-email` + componentes de formulário
  - Verificação: CA1, CA2, CA3, CA4, CA5, CA12, CA13
- [ ] **T11** — Telas `/recuperar-senha`, `/redefinir-senha`, `/painel` + "Sair"
  - Verificação: CA7, CA8, CA10, CA11
- [ ] **T12** — Bloqueio de tentativas ligado ao login (avisos e tela de bloqueado)
  - Verificação: CA14, CA15

## Emails e Google
- [ ] **T13** — Modelos `supabase/templates/*.html` (formais, com logo) + C3 (colar no painel) + C6 (logo no bucket)
  - Verificação: CA16 (Gmail web/celular e Outlook)
- [ ] **T14** — Google: C4 (Google Cloud) + C5 (Supabase) com guia
  - Verificação: CA6, CA9

## Fechamento
- [ ] **T15** — ADRs 0013 (bloqueio de tentativas) e 0014 (rotas privadas por padrão)
- [ ] **T16** — Rodar todos os critérios de aceite em 375 e 1440 px, temas claro e escuro
- [ ] **T17** — Agentes `security` (CA-seg) e `qa` (CA-a11y, CA-build)
- [ ] **T18** — `npm run typecheck`, `npm run lint`, `npm run build`
- [ ] **T19** — Atualizar ROADMAP (Etapa 3 ✅, T3/T4 resolvidas, Resend + domínio como pré-requisito do deploy), CHANGELOG, LICOES, ARQUITETURA
- [ ] **T20** — Commits finais + PR para `main`

## Registro

| Task | Commit | Observação |
|---|---|---|
| T0 | `927d33d` | spec + plan + tasks |
| T1–T3 | | Aplicadas em 2026-10-12. Teste anônimo: tabela negada; 5 falhas → bloqueio de 10 min; email normalizado (maiúsculas/espaços); `clear` e `login_email_hash` negados sem login; bucket `brand` existe |
