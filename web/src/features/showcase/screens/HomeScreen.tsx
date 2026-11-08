import type { CSSProperties, ReactNode } from "react";
import { ArrowDownLeft, ArrowUpRight, CreditCard, Scale } from "lucide-react";
import { cn } from "cn";

import { CategoryDonut, type DonutSlice } from "@/components/shared/CategoryDonut";
import {
  cardAccount,
  monthExpenseCents,
  monthExpenseShare,
  monthIncomeCents,
  monthLeftoverCents,
  spendingByCategory,
} from "@/features/showcase/showcase-data";
import { formatSignedCurrency } from "@/lib/utils/currency";

/** No aparelho cabem as três maiores; o resto da lista "continua" abaixo da dobra. */
const TOP_CATEGORIES = 3;

const slices: DonutSlice[] = spendingByCategory.map((category) => ({
  key: category.name,
  color: category.color,
  share: category.share,
}));

/**
 * Início do app (spec 005) em miniatura: dívida do cartão à parte, o resumo do mês e os gastos
 * por categoria, na mesma ordem do celular. O saldo total é o número grande do topo.
 * `intro`: os blocos entram um a um na primeira exibição (assinatura, ver .sum-row).
 * `spendingFirst`: no aparelho cortado da seção "Para onde vai seu dinheiro" (celular), os gastos
 * sobem para o topo, senão o corte esconde justamente o assunto da seção.
 */
export function HomeScreen({ intro = false, spendingFirst = false }: { intro?: boolean; spendingFirst?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-3", spendingFirst && "[&>:last-child]:order-first")}>
      <Block index={0} intro={intro} className="flex items-center gap-2.5 px-3 py-2.5">
        <CreditCard className="size-4 text-muted-foreground" aria-hidden="true" />
        <span className="flex-1 text-xs font-medium text-muted-foreground">Dívida do cartão</span>
        <span className="text-sm font-semibold text-expense tabular-nums">
          {formatSignedCurrency(cardAccount.cents, "out")}
        </span>
      </Block>

      <Block index={1} intro={intro} className="space-y-2.5 p-3">
        <FlowLine label="Receitas" cents={monthIncomeCents} direction="in" share={100} />
        <FlowLine label="Despesas" cents={monthExpenseCents} direction="out" share={monthExpenseShare} />
        <p className="flex items-center gap-2 border-t border-border pt-2.5 text-xs font-medium">
          <Scale className="size-3.5 text-muted-foreground" aria-hidden="true" />
          <span className="flex-1">Resultado do mês</span>
          <span className="text-sm font-semibold text-income tabular-nums">
            {formatSignedCurrency(monthLeftoverCents, "in")}
          </span>
        </p>
      </Block>

      <Block index={2} intro={intro} className="p-3">
        <p className="text-sm font-semibold">Gastos por categoria</p>
        <div className="mt-2.5 flex items-center gap-3">
          <CategoryDonut
            slices={slices}
            count={spendingByCategory.length}
            gapColor="var(--card)"
            animate
            className="size-26 shrink-0"
          />
          <ul className="min-w-0 flex-1 space-y-1.5" aria-label="Gastos por categoria">
            {spendingByCategory.slice(0, TOP_CATEGORIES).map((category) => (
              <li key={category.name} className="flex items-center gap-1.5 text-xs">
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: category.color }} aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate font-medium">{category.name}</span>
                <span className="text-muted-foreground tabular-nums">{Math.round(category.share)}%</span>
              </li>
            ))}
          </ul>
        </div>
      </Block>
    </div>
  );
}

type BlockProps = { index: number; intro: boolean; className?: string; children: ReactNode };

/** Cartão do Início, com a entrada em sequência quando é a primeira exibição. */
function Block({ index, intro, className, children }: BlockProps) {
  return (
    <div
      className={cn("rounded-xl border border-border bg-card text-card-foreground", intro && "sum-row", className)}
      style={{ "--sum-index": index } as CSSProperties}
    >
      {children}
    </div>
  );
}

type FlowLineProps = { label: string; cents: number; direction: "in" | "out"; share: number };

/** Receita ou despesa com sinal, seta e barra: nunca só a cor. */
function FlowLine({ label, cents, direction, share }: FlowLineProps) {
  const Icon = direction === "in" ? ArrowDownLeft : ArrowUpRight;
  const tone = direction === "in" ? "text-income" : "text-expense";

  return (
    <div>
      <p className="flex items-center gap-2 text-xs">
        <Icon className={cn("size-3.5", tone)} aria-hidden="true" />
        <span className="flex-1 text-muted-foreground">{label}</span>
        <span className={cn("text-sm font-semibold tabular-nums", tone)}>{formatSignedCurrency(cents, direction)}</span>
      </p>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div
          className={cn("grow-x h-full rounded-full", direction === "in" ? "bg-income" : "bg-expense")}
          style={{ width: `${share}%` }}
        />
      </div>
    </div>
  );
}
