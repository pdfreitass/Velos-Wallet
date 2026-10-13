# ADR 0003 — Banco em sa-east-1 (São Paulo)

- **Status:** Aceita
- **Data:** 2026-10-12
- **Etapa:** 2 — Modelo de dados

## Contexto

O primeiro projeto Supabase (`yldlygsoponbvvyohcba`) foi criado em **us-west-2 (Oregon)**. O público do Velos é 100% brasileiro. A região de um projeto Supabase **não pode ser alterada** depois de criado. O banco ainda estava vazio.

## Decisão

Criamos um projeto novo, **`khvottmyspapwsdeqqnm`, em sa-east-1 (São Paulo)**, aplicamos as migrations nele e descartamos o de Oregon.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Ficar em us-west-2 | ~150–200 ms a mais por ida e volta, multiplicados por cada query de cada página. |
| Migrar depois | Com dados de usuários, vira dump/restore, janela de manutenção e troca de chaves. Hoje custava 5 minutos. |

## Consequências

- **Positivas:** latência baixa para o público-alvo; dados armazenados no Brasil.
- **Regra:** todo recurso de infraestrutura novo fica em São Paulo. **Vercel: região `gru1`** para as functions ficarem perto do banco.
- Ver [LICOES L04](../LICOES.md).
