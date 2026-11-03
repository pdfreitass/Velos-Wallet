# Tasks 010 — Rosca de categorias no Início

> Passos pequenos e verificáveis. Uma task por vez; ao terminar cada uma, parar e mostrar.
> O **o quê** está na [spec.md](spec.md), o **como** no [plan.md](plan.md).

- [x] **T1 — Componente de rosca partilhado**
  Criar `web/src/components/shared/CategoryDonut.tsx` com a assinatura do plano (`slices`, `count`, `gapColor`). Move o `conic-gradient` e a fresta que hoje vivem na vitrine. `aria-hidden` na rosca inteira; singular/plural no rótulo do centro.
  *Pronto quando:* compila e o `typecheck` passa.

- [x] **T2 — Vitrine a usar o componente**
  `showcase/screens/CategoriesScreen.tsx` passa a usar o `CategoryDonut`, passando os seus 5 fixos e `gapColor="var(--background)"`. Apagar o IIFE do gradiente de lá.
  *Pronto quando:* **CA7** — `/` aberta antes e depois está igual, nos dois temas.

- [x] **T3 — Agrupamento**
  `toDonutSlices(categories, totalCents)` ao lado do `CategorySpending`: 5 maiores + "Outras" com o resto (RN1), cor neutra para "Outras" (RN6), "Sem categoria" tratada como categoria normal (RN7).
  *Pronto quando:* o `typecheck` passa e a função não depende de nada do React.

- [x] **T4 — Rosca no Início**
  Ligar o `CategoryDonut` dentro do `CategorySpending`, acima da lista. A lista e os links **não mudam** (RN2, RN3).
  *Pronto quando:* **CA1**, **CA3**, **CA4** e **CA5** conferidos no navegador.

- [x] **T5 — Skeleton**
  Ajustar o último bloco do `DashboardSkeleton` para reservar o espaço da rosca.
  *Pronto quando:* ao recarregar o Início a tela não salta quando os dados chegam.

- [x] **T6 — Aceite**
  Conferir **CA1 a CA8**, **CA-a11y** e **CA-build**, em 375 px e nos dois temas. Para o **CA2** (9 categorias) e o **CA8** (1 categoria), lançar transações de teste pelo app e apagá-las no fim.
  *Pronto quando:* todos marcados na spec.

- [x] **T7 — Documentação**
  Atualizar [ROADMAP](../../ROADMAP.md), [CHANGELOG](../../CHANGELOG.md) e [LICOES](../../LICOES.md) se houver lição. Marcar o [ADR 0018](../../adr/0018-grafico-de-categorias-sem-biblioteca.md) como revisto pelo [0019](../../adr/0019-rosca-de-categorias-em-css.md).
  *Pronto quando:* commitado em `devpedro`.
