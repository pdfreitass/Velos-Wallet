# ADR 0002 — Supabase com `@supabase/ssr` e segurança na RLS

- **Status:** Substituída em parte por [0013](0013-api-aspnet-e-front-react-vite.md) em 2026-10-12: sai o `@supabase/ssr`; a RLS continua valendo, agora acionada pela API
- **Data:** 2026-10-11
- **Etapa:** 1 — Setup / 2 — Modelo de dados

## Contexto

Precisamos de Postgres, autenticação (email + Google) e isolamento total entre usuários, sem manter um backend próprio.

## Decisão

Usamos **Supabase** acessado pelo pacote **`@supabase/ssr`**, com a **segurança no banco**: RLS ligada em todas as tabelas, policies por comando com `(select auth.uid())`, e o app usando apenas a chave **publicável**.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| `@supabase/auth-helpers-nextjs` | Descontinuado. |
| Firebase | Sem SQL; agregações (saldo, resumo mensal) seriam feitas no client. |
| Postgres próprio + Auth.js + Prisma | Mais peças para manter num projeto solo. |
| Segurança só no código (sem RLS) | Um bug no app vazaria dados de outros usuários. |

## Consequências

- **Positivas:** mesmo com um bug no app, um usuário não consegue ler dados de outro; constraints e FKs compostas validam no banco.
- **Negativas:** lógica de segurança em SQL, que precisa ser testada (ver o teste de `[]` sem sessão no CHANGELOG).
- **Regras:** um `createClient()` novo por request no servidor; `service_role`/secret key nunca no client; todo tipo vem de `database.types.ts` gerado.
