# ADR 0001 — Next.js 15 com App Router (e ficar no 15)

- **Status:** Aceita
- **Data:** 2026-10-11
- **Etapa:** 1 — Setup

## Contexto

O app precisa de renderização no servidor (dados financeiros privados, sem expor lógica no client), mutações seguras e deploy simples. Na data da decisão já existia o Next 16.4.0.

## Decisão

Usamos **Next.js 15.5.27** com **App Router** e Turbopack, **Server Components por padrão** e **Server Actions** para mutações. Ficamos no 15, sem migrar para o 16 agora.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Next 16.4 | Major recente; o ecossistema (shadcn, `@supabase/ssr`, exemplos) ainda referencia o 15. O ganho não compensava o risco no início do projeto. |
| Pages Router | Sem Server Components nem Server Actions. |
| Vite + SPA | Exigiria uma API separada e exporia mais lógica no client. |

## Consequências

- **Positivas:** leitura no servidor com RLS, Server Actions validadas com Zod, deploy nativo na Vercel.
- **Risco aceito:** o `npm audit` acusa um aviso de `postcss` **dentro do próprio `next`**, corrigido só no 16. É ferramenta de build sobre CSS escrito por nós, então a exposição é baixa.
- **Regra:** `"use client"` só com interatividade; `cookies()` é assíncrono no 15 (por isso o `createClient` do servidor é `async`).

## Quando revisitar

**Antes do deploy em produção.**
