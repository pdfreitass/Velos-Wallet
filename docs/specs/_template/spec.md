# Spec NNN — Nome da feature

> **O QUE** fazer e **como saber que está pronto.** Nada de detalhe técnico aqui: isso vai no [plan.md](plan.md).
> Copie esta pasta para `docs/specs/NNN-nome/` e preencha antes de escrever código.

- **Etapa do roadmap:** (ex.: Etapa 3 — Autenticação)
- **Status:** Rascunho | Aprovada | Em implementação | Concluída
- **Data:** AAAA-MM-DD

## Problema

Que dor do usuário isto resolve? Ligar a um objetivo da [VISAO.md](../../VISAO.md).

## Histórias de usuário

- Como **usuário**, quero …, para …
- Como **usuário**, quero …, para …

## Escopo

### Dentro
- …

### Fora (explicitamente)
- … (conferir também "Fora do escopo do MVP" na VISAO)

## Regras de negócio

Regras que valem independentemente da tela. Numeradas, para citar nos testes e nas tasks.

- **RN1** — …
- **RN2** — …

## Telas e estados

Para cada tela/lista: como fica em **375 px**, no tema **claro e escuro**, e nos estados **carregando (skeleton)**, **vazio** e **erro**.

| Tela | Rota | Estados obrigatórios | Observações |
|---|---|---|---|
| … | `/…` | loading · vazio · erro · sucesso | … |

Textos da interface em **português do Brasil**, com acento.

## Critérios de aceite

Cada critério deve poder ser verificado por alguém que não escreveu o código.

- [ ] **CA1** — Dado …, quando …, então …
- [ ] **CA2** — …
- [ ] **CA-seg** — Um usuário não consegue ler nem alterar dados de outro (RLS).
- [ ] **CA-a11y** — Funciona em 375 px, nos dois temas, e nenhuma informação depende só da cor.
- [ ] **CA-build** — `npm run typecheck`, `npm run lint` e `npm run build` passam.

## Perguntas em aberto

- [ ] … (resolver antes de mudar o status para **Aprovada**)
