# ADR 0011 — Profile e categorias padrão criados por trigger no banco

- **Status:** Aceita
- **Data:** 2026-10-11
- **Etapa:** 2 — Modelo de dados

## Contexto

Todo usuário novo precisa de um `profile` e de categorias iniciais para conseguir lançar a primeira transação. O cadastro pode vir de email, Google, convite ou do painel do Supabase.

## Decisão

O trigger **`on_auth_user_created`** (`AFTER INSERT` em `auth.users`) chama `handle_new_user()`, que cria o profile e as **10 categorias padrão**. A função é `SECURITY DEFINER` com `set search_path = ''`.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Criar no código do app, após o signup | Um erro de rede no meio deixa usuário sem profile; não cobre o cadastro feito pelo painel. |
| Categorias globais compartilhadas | O usuário não poderia renomear/apagar sem afetar os outros. |

## Consequências

- **Positivas:** impossível existir usuário sem profile; funciona para qualquer via de cadastro.
- **Negativas:** mudar as categorias padrão exige migration (e não afeta usuários existentes).
- Nome do profile: `full_name` → `name` (metadata do OAuth) → parte do email antes do `@` → "Você".
