# ADR 0010 — PWA instalável antes de app nativo

- **Status:** Aceita
- **Data:** 2026-10-11
- **Etapa:** 8 — PWA

## Contexto

O público usa principalmente o celular, mas o produto ainda não foi validado. App nativo exige lojas, revisão, duas bases de código ou React Native/Expo.

## Decisão

O MVP é um **PWA apenas instalável** (manifest + ícones). **Sem offline-first.** App nativo só depois do MVP validado.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| React Native / Expo já no MVP | Dobra o trabalho antes de saber se o produto funciona. |
| PWA offline-first | Sincronização e conflitos de dados financeiros são complexos; fora do escopo. |

## Consequências

- **Positivas:** um código só para web, celular e desktop; atualizações instantâneas.
- **Negativas:** sem notificações push confiáveis no iOS; precisa de internet.
