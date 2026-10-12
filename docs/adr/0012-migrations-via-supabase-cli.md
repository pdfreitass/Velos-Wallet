# ADR 0012 — Migrations versionadas e aplicadas só pelo Supabase CLI

- **Status:** Aceita
- **Data:** 2026-10-12
- **Etapa:** 2 — Modelo de dados

## Contexto

As primeiras migrations foram coladas no SQL Editor do painel: rodaram no projeto errado e não ficaram registradas no histórico de migrations do Supabase. Um `db push` posterior tentaria reaplicá-las.

## Decisão

- Toda mudança de schema é um arquivo novo em `supabase/migrations/` (`NNNN_nome.sql`). **Arquivos já aplicados nunca são editados.**
- Aplicação **somente** com `npx supabase db push` (projeto vinculado por `supabase link`).
- Depois de aplicar: `npm run types:db`.
- O CLI é **devDependency** (`supabase@^2.120.0`); `types:db` usa `--linked` (funciona no Windows).

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| SQL Editor do painel | Sem histórico; fácil rodar no projeto errado. |
| ORM com migrations (Prisma/Drizzle) | Camada extra; RLS, triggers e views seriam SQL cru de qualquer forma. |
| CLI instalado globalmente | Versão diferente em cada máquina; nada no lockfile. |

## Consequências

- **Positivas:** `supabase migration list` mostra exatamente o que está aplicado; recriar o banco é um `db push`.
- **Atenção:** `db push` altera **produção**. Rodar `npx supabase db push --dry-run` antes.
- Ver [LICOES L05](../LICOES.md).
