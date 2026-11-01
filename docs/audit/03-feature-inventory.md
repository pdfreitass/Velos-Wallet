# 03 · Inventário de funcionalidades

> Legenda: **CONCLUÍDA** · **PARCIAL** · **APENAS VISUAL** · **COM PROBLEMAS** · **AUSENTE** · **NÃO VERIFICADA**.
> "Concluída" = código lido + testes existentes + docs coerentes. **Nenhuma foi reexecutada** nesta auditoria.

## Resumo

| Estado | Qtde |
|---|---|
| CONCLUÍDA | 10 |
| PARCIAL | 0 |
| APENAS VISUAL | 2 |
| COM PROBLEMAS | 1 |
| AUSENTE | 8 |
| NÃO VERIFICADA | 1 |
| **Total** | **22** |

## Concluídas (preservar)

| # | Funcionalidade | Onde | Evidência | Falta / melhoria justificada |
|---|---|---|---|---|
| F01 | **Cadastro** com email e senha | `SignUp.cs`, `SignUpForm.tsx`, `PasswordPolicy`, `EmailAddress` | 5 testes de handler + 4 de política; paridade de senha front/back (`check:password`) | Confirmação de email (P0 p/ produção) |
| F02 | **Login** + bloqueio de tentativas | `SignIn.cs`, `LoginLockoutStore`, migrations `0005`/`0008` | 10 testes de handler; reserva atômica; ADR 0014 | Nada para o MVP |
| F03 | **Logout** | `SignOutHandler`, `PanelPage` | Apaga também cookies dos fluxos de recuperação/Google | — |
| F04 | **Sessão** em cookie httpOnly + renovação automática | `SessionCookies`, `TokenRefreshMiddleware`, `AuthenticationSetup` | JWT ES256 por Discovery | Sem teste de endpoint |
| F05 | **Login com Google** (PKCE pela API) | `GoogleSignIn.cs`, `AuthCallbackController` | 6 testes; app Google em modo *Teste* | Sair do modo Teste antes de produção |
| F06 | **Proteções transversais**: privado por padrão, CSRF, limite por IP, cabeçalhos, redirect seguro | `Program.cs`, `CsrfHeaderMiddleware`, `RateLimitingSetup`, `SafeRedirect` | ADR 0015; 3 testes de `SafeRedirect` | Teste de endpoint; CSP completa (P2) |
| F07 | **Isolamento por usuário** (UserDbSession + RLS + role sem bypass) | `UserDbSession.cs`, `0002`, `0007` | 7 testes de integração (anon, usuário, rollback, reset de role) | Teste de isolamento *entre dois usuários* nas tabelas financeiras quando existirem |
| F08 | **Página inicial** pública | `features/landing`, `LandingPage` | Lighthouse 93–96 / acessibilidade 100 (registro do CHANGELOG, não reexecutado) | T7 (fios), promessa de PWA |
| F09 | **Tema** claro/escuro sem flash | `index.html`, `ThemeToggle`, `globals.css` | ADR 0009, 0016 | — |
| F10 | **Helpers** de dinheiro e data | `currency.ts`, `date.ts` | Lidos por inteiro: centavos inteiros, `parseISO`, `toCents` | **Sem testes automatizados** (P1) |

## Apenas visuais

| # | Funcionalidade | Onde | Por quê | O que falta |
|---|---|---|---|---|
| F11 | **Painel** `/painel` | `PanelPage.tsx` | Só "Olá, {nome}" e Sair; o texto diz "sendo construído" | Etapa 6 inteira |
| F12 | **Vitrine do app** (iPhone com Contas/Mês/Gastos/Metas) | `features/showcase` | Dados fictícios em `showcase-data.ts`, rotulados como exemplo; totais são constantes | Nada: é material de marketing por desenho. **Não deve ser confundida com o app real** |

## Com problemas

| # | Funcionalidade | Onde | Problemas |
|---|---|---|---|
| F13 | **Modelo de dados / migrations** | `0001`–`0008` | (a) T11: `on delete set null` na FK composta tentaria anular `user_id` (`not null`) → apagar categoria com transações falha. (b) T1: `goal_contributions` sem `updated_at`/trigger. (c) **Apagar conta apaga transações em cascata, inclusive o lado de destino de transferências** (FI-01). (d) Não há como arquivar conta/categoria. (e) Falta de `default current_date` fuso-seguro. O resto (RLS, views, FKs compostas, triggers) está correto. Detalhe em [05](05-financial-integrity.md) |

## Ausentes

O **schema** existe e está aplicado (exceto onde indicado); falta tudo acima dele (endpoint, handler, validação, tela, teste).

| # | Funcionalidade | Schema | API | UI | Etapa |
|---|---|---|---|---|---|
| F14 | Contas (CRUD, 4 tipos, saldo) | ✔ `accounts`, `account_balances` | ✘ | ✘ | 4 |
| F15 | Categorias (CRUD, cor, ícone) | ✔ `categories` + 10 padrão via trigger | ✘ | ✘ | 4 |
| F16 | Transações (CRUD, filtro por mês/categoria) | ✔ `transactions` | ✘ | ✘ | 5 |
| F17 | Transferências entre contas | ✔ (registro único + CHECK) | ✘ | ✘ | 5 |
| F18 | Dashboard (saldo, mês, categoria, cartão) | ✔ `monthly_summary` (falta view por categoria) | ✘ | ✘ | 6 |
| F19 | Metas e aportes | ✔ `goals`, `goal_contributions`, `goal_progress` | ✘ | ✘ | 7 |
| F20 | PWA instalável | — | — | ✘ (`web/public` só tem favicon e logos; sem manifest) | 8 |
| F21 | Perfil, exportar dados e excluir conta | ✔ `profiles` | ✘ (`/api/me` só lê o nome) | ✘ | sem etapa |

## Não verificadas

| # | Funcionalidade | Motivo |
|---|---|---|
| F22 | **Recuperação de senha** ponta a ponta | O código e os testes de handler existem, mas o CA7 (pedir link, abrir, trocar a senha, entrar, link não funcionar de novo) **nunca foi executado** por limite de email do Supabase (T9). O modelo de email `recovery.html` ainda monta `token_hash`, que o `/auth/confirm` não aceita (ROADMAP "antes do deploy"). Tratar como **não funcionando em produção** até testar |

## Plataforma (fora da contagem)

| Item | Estado |
|---|---|
| CI/CD | AUSENTE |
| Testes do front | AUSENTE |
| Testes de endpoint da API | AUSENTE |
| Observabilidade | AUSENTE (só logs básicos) |
| Backup/ambiente de staging | AUSENTE / não documentado |
| Documentação (SDD, ADRs, lições) | CONCLUÍDA e consistente |
