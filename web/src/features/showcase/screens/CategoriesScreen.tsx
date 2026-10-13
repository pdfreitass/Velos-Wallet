import { cn } from "cn";

import { spendingByCategory } from "@/features/showcase/showcase-data";
import { formatCurrency } from "@/lib/utils/currency";

/** Fatias da rosca, com uma fresta da cor da tela entre elas. */
const donutGradient = (() => {
  const gap = 0.6;
  let start = 0;
  const stops = spendingByCategory.map((category) => {
    const end = start + category.share;
    const stop = `${category.color} ${start}% ${end - gap}%, var(--background) ${end - gap}% ${end}%`;
    start = end;
    return stop;
  });
  return `conic-gradient(${stops.join(", ")}, var(--background) ${start}% 100%)`;
})();

/**
 * Gastos do mês por categoria: rosca em CSS (sem biblioteca de gráfico na página inicial) e a
 * lista com nome, valor e participação. A rosca é decorativa; a informação está na lista.
 * `donutOnly`: só a rosca (janela de navegador do fechamento, onde o iPhone cobre a lista).
 */
export function CategoriesScreen({ donutOnly = false }: { donutOnly?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <div className={cn("relative size-30", donutOnly ? "mr-auto" : "mx-auto")} aria-hidden="true">
        <div className="donut grow-turn absolute inset-0 rounded-full" style={{ backgroundImage: donutGradient }} />
        <div className="absolute inset-0 grid place-items-center text-center">
          <span>
            <span className="block text-lg font-semibold tabular-nums">{spendingByCategory.length}</span>
            <span className="block text-xs text-muted-foreground">categorias</span>
          </span>
        </div>
      </div>

      {donutOnly ? null : (
        <ul className="space-y-0.5" aria-label="Gastos por categoria">
          {spendingByCategory.map((category) => (
            <li key={category.name} className="flex items-center gap-2.5 py-1.5 text-sm">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: category.color }} aria-hidden="true" />
              <category.icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate font-medium">{category.name}</span>
              <span className="font-semibold tabular-nums">{formatCurrency(category.cents)}</span>
              <span className="w-8 text-right text-xs text-muted-foreground tabular-nums">
                {Math.round(category.share)}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
