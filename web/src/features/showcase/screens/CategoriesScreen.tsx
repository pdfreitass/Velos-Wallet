import { CategoryDonut, type DonutSlice } from "@/components/shared/CategoryDonut";
import { spendingByCategory } from "@/features/showcase/showcase-data";
import { formatCurrency } from "@/lib/utils/currency";

/** Os 5 exemplos são poucos e fixos: cada um é uma fatia, sem agrupar nada. */
const slices: DonutSlice[] = spendingByCategory.map((category) => ({
  key: category.name,
  color: category.color,
  share: category.share,
}));

/**
 * Gastos do mês por categoria: a rosca partilhada com o Início ([ADR 0019](../../../../../docs/adr/0019-rosca-de-categorias-em-css.md))
 * e a lista com nome, valor e participação. A rosca é decorativa; a informação está na lista.
 * `donutOnly`: só a rosca (janela de navegador do fechamento, onde o iPhone cobre a lista).
 */
export function CategoriesScreen({ donutOnly = false }: { donutOnly?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Aqui a rosca fica sobre o fundo da tela do iPhone, não dentro de um cartão. */}
      <CategoryDonut
        slices={slices}
        count={spendingByCategory.length}
        gapColor="var(--background)"
        animate
        className={donutOnly ? "mr-auto" : "mx-auto"}
      />

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
