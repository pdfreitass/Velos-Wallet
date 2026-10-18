import type { CSSProperties } from "react";
import { PieChart } from "lucide-react";
import { Link } from "react-router";

import { CategoryIcon } from "@/components/shared/CategoryBadge";
import { categoryColorVar } from "@/features/categories/catalog";
import { CATEGORY_PARAM, MONTH_PARAM } from "@/features/transactions/types";
import { ROUTES } from "@/lib/auth/routes";
import { formatSignedCurrency } from "@/lib/utils/currency";

import type { CategorySpending as Spending, Dashboard } from "./api";

/**
 * RN4: gastos do mês por categoria, do maior para o menor, em barras horizontais feitas em HTML
 * (ADR 0018). Nome, valor e porcentagem são texto; a barra só reforça. Cada linha leva à lista de
 * transações já filtrada pela categoria.
 */
export function CategorySpending({ data }: { data: Dashboard }) {
  return (
    <section aria-labelledby="category-spending" className="rounded-2xl border border-border bg-card p-5">
      <h2 id="category-spending" className="mb-4 font-semibold">
        Gastos por categoria
      </h2>
      {data.categories.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center text-muted-foreground">
          <PieChart className="size-8" aria-hidden="true" />
          <p>Nenhuma despesa neste mês.</p>
        </div>
      ) : (
        <ul className="space-y-1">
          {data.categories.map((item) => (
            <li key={item.categoryId ?? "none"}>
              <SpendingRow item={item} month={data.month} totalCents={data.expenseCents} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SpendingRow({ item, month, totalCents }: { item: Spending; month: string; totalCents: number }) {
  // Porcentagem e largura são só exibição (o valor em centavos veio somado do banco).
  // Arredondada por linha, então a soma pode dar 99% ou 101%; abaixo de 0,5% vira "<1%", não "0%".
  const percent = totalCents > 0 ? Math.round((item.amountCents * 100) / totalCents) : 0;
  const percentLabel = percent === 0 && item.amountCents > 0 ? "<1%" : `${percent}%`;
  const name = item.name ?? "Sem categoria";
  const color = item.color ? categoryColorVar(item.color) : "var(--muted-foreground)";
  const href = item.categoryId
    ? `${ROUTES.transactions}?${MONTH_PARAM}=${month}&${CATEGORY_PARAM}=${item.categoryId}`
    : `${ROUTES.transactions}?${MONTH_PARAM}=${month}`;

  return (
    <Link
      to={href}
      style={{ "--category": color } as CSSProperties}
      className="-mx-2 flex min-h-14 items-center gap-3 rounded-xl px-2 py-2 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {item.icon && item.color ? (
        <CategoryIcon color={item.color} icon={item.icon} />
      ) : (
        <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm text-secondary-foreground">
          ?
        </span>
      )}
      <span className="min-w-0 flex-1 space-y-1.5">
        <span className="flex items-baseline justify-between gap-3">
          <span className="truncate font-medium">{name}</span>
          <span className="shrink-0 text-sm tabular-nums">
            <span className="font-semibold text-expense">{formatSignedCurrency(item.amountCents, "out")}</span>
            <span className="ml-2 text-muted-foreground">{percentLabel}</span>
          </span>
        </span>
        <span className="block h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <span className="block h-full rounded-full bg-(--category)" style={{ width: `${Math.max(percent, 2)}%` }} />
        </span>
      </span>
    </Link>
  );
}
