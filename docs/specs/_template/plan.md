# Plano técnico — Spec NNN: Nome da feature

> **COMO** implementar a [spec.md](spec.md). Escrito depois de a spec ser aprovada e antes de qualquer código.
> Conferir contra [ARQUITETURA.md](../../ARQUITETURA.md), [LICOES.md](../../LICOES.md) e as [ADRs](../../adr/).

## Resumo da abordagem

Duas ou três frases sobre a estratégia.

## Banco de dados

- **Migration nova:** `supabase/migrations/NNNN_nome.sql` (ou "nenhuma")
- Tabelas/colunas/views/policies afetadas: …
- Checklist para tabela nova: `user_id` · RLS · 4 policies com `(select auth.uid())` · `created_at` · `updated_at` + trigger `set_updated_at`
- View nova? → `with (security_invoker = on)` e `sum()` com `::bigint`
- Depois: `npx supabase db push --dry-run` → `npx supabase db push` → `npm run types:db`

## Arquivos

| Ação | Caminho | Responsabilidade |
|---|---|---|
| criar | `src/lib/validations/<dominio>.ts` | schema Zod compartilhado |
| criar | `src/server/queries/<dominio>.ts` | leituras |
| criar | `src/server/actions/<dominio>.ts` | Server Actions validadas com Zod |
| criar | `src/app/(app)/<rota>/page.tsx` | Server Component da página |
| criar | `src/components/features/<dominio>/…` | componentes da feature (< ~150 linhas cada) |
| alterar | … | … |

## Fluxo de dados

```
(descrever leitura e escrita: página → query/action → Supabase → revalidatePath)
```

## Validação

- Schema Zod: campos, limites, mensagens em pt-BR.
- O que o **banco** já garante (constraints/FKs/RLS) e o que só o app valida.

## Dependências novas

Nenhuma | `pacote@versão` — **motivo** (o CLAUDE.md exige explicar antes de instalar).

## Decisões

Alguma decisão nova que mereça ADR? → criar `docs/adr/NNNN-nome.md` a partir do template.

## Riscos e armadilhas

- Dinheiro: centavos, `toCents()` na fronteira, `formatCurrency()` na exibição.
- Datas: `parseDbDate`/`toDbDate`, nunca `new Date("yyyy-MM-dd")`.
- Recharts → `"use client"`.
- …

## Como testar

- Manual: passo a passo para cada critério de aceite da spec.
- RLS: como provar que outro usuário não vê os dados.
- `npm run typecheck && npm run lint && npm run build`.
