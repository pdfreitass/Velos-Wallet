# ADR 0007 — Transferência como registro único; cartão de crédito fora do saldo

- **Status:** Aceita
- **Data:** 2026-10-11
- **Etapa:** 2 — Modelo de dados

## Contexto

Mover dinheiro entre contas próprias não é receita nem despesa. Cartão de crédito tem saldo que é **dívida**, não dinheiro disponível. Fatura (fechamento, vencimento, pagamento) está fora do MVP.

## Decisão

- **Transferência** é **uma linha** em `transactions` com `type = 'transfer'`, `account_id` (origem) e `transfer_account_id` (destino), **sem categoria**. Um CHECK garante essa forma, e origem ≠ destino.
- Transferências **não entram** em `monthly_summary`.
- **Cartão de crédito** é uma conta normal (`credit_card`), pode ter saldo inicial negativo e fica **fora do "saldo total"** (que soma só `checking`/`savings`/`cash`). A dívida aparece em card separado.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Transferência como 2 registros (saída + entrada) | Pode ficar pela metade; editar exige sincronizar dois registros. |
| Tabela de fatura no MVP | Fora do escopo; complexidade alta para validar o produto. |

## Consequências

- **Positivas:** atomicidade de graça; relatórios mensais limpos.
- **Negativas:** `account_balances` precisa de um `UNION ALL` para contar o lado de entrada.
