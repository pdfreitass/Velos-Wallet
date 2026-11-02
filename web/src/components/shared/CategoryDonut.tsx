import { cn } from "cn";

/** Uma fatia já pronta: o componente não ordena, não agrupa e não calcula porcentagem. */
export type DonutSlice = {
  /** Só para a key do React; não aparece na tela. */
  key: string;
  /** Cor da fatia, igual à da linha correspondente na lista. */
  color: string;
  /** Participação no total, de 0 a 100. */
  share: number;
};

type CategoryDonutProps = {
  slices: DonutSlice[];
  /** Vai no centro: a contagem **real** de categorias do mês, não o número de fatias (RN5). */
  count: number;
  /**
   * Cor da fresta entre as fatias. Tem de ser a cor do que está **atrás** da rosca: no app ela
   * fica dentro de um cartão (`--card`), na vitrine sobre o fundo da tela (`--background`).
   */
  gapColor?: string;
  /** A rosca gira ao entrar. Liga na vitrine; no app repetiria a cada troca de mês. */
  animate?: boolean;
  className?: string;
};

/** Largura da fresta entre fatias, em pontos percentuais da volta. */
const GAP = 0.6;

function toGradient(slices: DonutSlice[], gapColor: string): string {
  let start = 0;
  const stops = slices.map((slice) => {
    const end = start + slice.share;
    const stop = `${slice.color} ${start}% ${end - GAP}%, ${gapColor} ${end - GAP}% ${end}%`;
    start = end;
    return stop;
  });
  // O resto fecha com a cor da fresta: arredondamento não deixa a soma dar 100% exatos.
  return `conic-gradient(${stops.join(", ")}, ${gapColor} ${start}% 100%)`;
}

/**
 * Rosca de gastos por categoria ([ADR 0019](../../../docs/adr/0019-rosca-de-categorias-em-css.md)):
 * `conic-gradient` em CSS, sem biblioteca de gráfico. Partilhada pelo Início e pela vitrine da
 * página inicial, para as duas mostrarem a mesma coisa.
 *
 * **Decorativa de propósito** (RN4): o `aria-hidden` cobre a rosca e a contagem do centro, porque
 * tudo isso é redundante com a lista que vem logo abaixo. Nada vive só aqui.
 */
export function CategoryDonut({
  slices,
  count,
  gapColor = "var(--card)",
  animate = false,
  className,
}: CategoryDonutProps) {
  return (
    <div className={cn("relative size-30", className)} aria-hidden="true">
      <div
        className={cn("donut absolute inset-0 rounded-full", animate && "grow-turn")}
        style={{ backgroundImage: toGradient(slices, gapColor) }}
      />
      <div className="absolute inset-0 grid place-items-center text-center">
        <span>
          <span className="block text-lg font-semibold tabular-nums">{count}</span>
          <span className="block text-xs text-muted-foreground">
            {count === 1 ? "categoria" : "categorias"}
          </span>
        </span>
      </div>
    </div>
  );
}
