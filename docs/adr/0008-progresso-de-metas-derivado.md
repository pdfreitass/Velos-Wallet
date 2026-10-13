# ADR 0008 — Progresso das metas derivado dos aportes

- **Status:** Aceita
- **Data:** 2026-10-11
- **Etapa:** 2 — Modelo de dados

## Contexto

Uma meta tem valor-alvo e acumula aportes ao longo do tempo. Guardar o "valor atual" na própria meta cria uma segunda fonte de verdade.

## Decisão

`goals` **não tem `current_cents`**. O progresso é a soma de `goal_contributions`, exposta pela view `goal_progress`. Aportes são **manuais** no MVP e **não** movimentam contas.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| `current_cents` atualizado pelo app | Diverge se um aporte for apagado ou editado fora do fluxo. |
| Aporte como transação de uma conta | Acopla metas a contas; fica para depois do MVP, se fizer sentido. |

## Consequências

- **Positivas:** apagar/editar um aporte corrige o progresso automaticamente.
- **A DEFINIR:** se um aporte deve ou não debitar uma conta (hoje não debita).
