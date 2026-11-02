# Plan 010 — Rosca de categorias no Início

> **COMO**, tecnicamente. O **o quê** está na [spec.md](spec.md).

- **Status:** Aprovado
- **Data:** 2026-11-02
- **Decisão de fundo:** [ADR 0019](../../adr/0019-rosca-de-categorias-em-css.md)

## Estado de partida

A mesma informação é desenhada hoje em dois sítios, de formas diferentes:

| Onde | Arquivo | Desenho | Dados |
|---|---|---|---|
| App, Início | `features/dashboard/CategorySpending.tsx` | barras horizontais | `/api/dashboard` (reais) |
| Vitrine, `/` | `features/showcase/screens/CategoriesScreen.tsx` | rosca + lista | `showcase-data.ts` (fixos) |

A rosca da vitrine é um `conic-gradient` montado num IIFE no topo do módulo, com uma fresta de `var(--background)` entre fatias. Funciona, mas está preso àquele componente e àqueles dados.

## Desenho da solução

Extrair **um componente de rosca** que não sabe de onde vêm os dados, e usá-lo nos dois lados.

```
components/shared/CategoryDonut.tsx     ← novo, partilhado
    ↑                      ↑
showcase/CategoriesScreen  dashboard/CategorySpending
   (dados fixos)              (dados da API)
```

### O componente

```ts
type DonutSlice = { key: string; color: string; share: number };

type CategoryDonutProps = {
  slices: DonutSlice[];   // já agrupadas e já em ordem; o componente não decide nada
  count: number;          // o que vai no centro (contagem real de categorias)
  className?: string;
};
```

- Monta o `conic-gradient` a partir de `slices`, com a mesma fresta de hoje.
- `aria-hidden` na rosca (RN4); o centro é texto mas também fica dentro do `aria-hidden`, porque a contagem é redundante com a lista.
- Singular/plural do rótulo a partir de `count` (RN5, CA8).
- **Não** agrupa, **não** ordena, **não** calcula porcentagem: recebe pronto. Assim a vitrine passa os seus 5 fixos e o app passa o resultado do agrupamento, sem o componente ter de conhecer nenhum dos dois.

A fresta passa a usar a cor do **fundo do cartão** em vez de `var(--background)`: no app o bloco está dentro de um `bg-card`, e no tema escuro a diferença nota-se. Entra como `gapColor` com `var(--card)` por omissão — a vitrine passa `var(--background)`, que é o que ela usa hoje, para o CA7 (nada muda na página inicial).

### O agrupamento (RN1)

Função pura, testável, ao lado do componente do dashboard:

```ts
/** As 5 maiores viram fatia própria; o resto soma numa fatia "Outras". */
function toDonutSlices(categories: CategorySpending[], totalCents: number): DonutSlice[]
```

- As `categories` já chegam ordenadas da API (maior → menor), então é um `slice(0, 5)` e a soma da cauda.
- A porcentagem de cada fatia vem de `amountCents / totalCents`, em número de vírgula flutuante — **só para desenho**. O dinheiro continua em centavos e a soma continua a vir do banco (regra do `CLAUDE.md`).
- A fatia "Outras" só existe se sobrar mais de uma categoria; com exatamente 6, as 6 vão inteiras (RN1).
- Cor de "Outras": `var(--muted-foreground)`, a mesma que o `CategorySpending` já usa para "Sem categoria" — que é a cor neutra pedida pela RN6. "Sem categoria" continua a ser uma categoria normal para efeito de agrupamento (RN7).

### A ligação no app

No `CategorySpending.tsx`, dentro do `<section>` e antes do `<ul>`:

- rosca centrada, com `mb-4`;
- a lista fica como está — **nenhuma linha muda**, nenhum link muda (RN2, RN3, CA3).

No `DashboardStates.tsx`, o `DashboardSkeleton` cresce o último bloco (hoje `h-56`) para acomodar a rosca, para a tela não saltar quando carrega.

## O que não muda

- A API, a query, o tipo `Dashboard`, as somas — nada. Tudo o que a rosca precisa já vem no `/api/dashboard`.
- A lista do app e tudo o que o visitante vê na página inicial.
- Nenhuma dependência nova (ADR 0019).

## Riscos

| Risco | Mitigação |
|---|---|
| Mexer na vitrine quebrar a página inicial, que é o cartão de visita | CA7 é verificar `/` antes e depois; a vitrine mantém o seu `gapColor` de hoje |
| Arredondamento fazer as fatias não fecharem 100% | O gradiente acumula os `share` em vírgula flutuante e fecha o resto com a cor da fresta, como a vitrine já faz. A porcentagem **escrita** continua a ser a da lista, arredondada por linha, como hoje |
| A cor da fatia não bater com a da lista | As duas saem de `categoryColorVar` com o mesmo `hex` (CA4) |

## Testes

Não há teste automatizado de front no projeto (os 120 testes são da API, em xUnit). A verificação é a dos critérios de aceite, no navegador, nos dois temas e em 375 px — como foi feito nas Etapas 6 e 7.

A função `toDonutSlices` é pura e fica isolada para poder ganhar teste quando o front tiver suíte.
