# ADR 0006 — Agregações no SQL, em views com `security_invoker`

- **Status:** Aceita
- **Data:** 2026-10-11
- **Etapa:** 2 — Modelo de dados

## Contexto

Saldo por conta, resumo mensal e progresso de metas exigem somar muitas linhas. Fazer isso no JS obrigaria a trazer todas as transações para o servidor/cliente.

## Decisão

Agregações vivem em **views** no Postgres: `account_balances`, `monthly_summary` e `goal_progress`, todas com **`security_invoker = on`** e `sum()` com cast explícito para `bigint`.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Somar no JS | Tráfego e memória crescem com o histórico; risco de float. |
| Colunas de saldo atualizadas por trigger | Duas fontes de verdade; difícil de corrigir se divergir. |
| Funções RPC | Possível no futuro, mas views são mais simples e já respeitam a RLS com `security_invoker`. |
| Views sem `security_invoker` | Rodariam como o dono e **devolveriam dados de todos os usuários**. |

## Consequências

- **Positivas:** uma linha por conta/mês/meta trafega; a RLS continua valendo.
- **Regra:** toda view nova leva `with (security_invoker = on)`.

## Quando revisitar

Se `monthly_summary` ficar lenta com muitos dados → considerar view materializada ou índice adicional.
