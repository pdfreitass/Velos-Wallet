# ADR 0004 — Dinheiro em centavos inteiros, sinal pelo tipo

- **Status:** Aceita
- **Data:** 2026-10-11
- **Etapa:** 1 — Setup / 2 — Modelo de dados

## Contexto

Ponto flutuante não representa decimais com exatidão (`0.1 + 0.2 ≠ 0.3`). Num app financeiro, um centavo sumindo destrói a confiança.

## Decisão

- Valores são **centavos inteiros**: `bigint` no banco, `number` inteiro no TS.
- O valor é **sempre positivo** (`amount_cents > 0` por constraint). O sinal vem do `type` (`income`/`expense`/`transfer`).
- Conversão para reais só na exibição (`formatCurrency`), dentro do `Intl`.
- Input lido por `parseCurrencyInput`, que usa só os dígitos.
- Somas no SQL; `toCents()` normaliza o que vem do banco (`numeric` pode chegar como string).

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| `numeric(12,2)` + float no JS | O erro só mudaria de lugar: chegaria ao JS como float. |
| Biblioteca decimal (dinero.js, big.js) | Dependência extra para um problema que inteiros resolvem. |
| Valor com sinal (despesa negativa) | Duas fontes de verdade (sinal e tipo) que podem divergir. |

## Consequências

- **Positivas:** exatidão garantida; o banco rejeita valor zero ou negativo.
- **Negativas:** todo valor precisa passar pelos helpers; não dá para mostrar `amount_cents` cru.
- **Limite:** `Number.MAX_SAFE_INTEGER` em centavos ≈ R$ 90 trilhões, ou seja, sem risco prático.
