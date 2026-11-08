import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { cn } from "cn";

import {
  monthExpenseCents,
  monthExpenseShare,
  monthIncomeCents,
  recentTransactions,
} from "@/features/showcase/showcase-data";
import { formatSignedCurrency } from "@/lib/utils/currency";

/** Entradas × saídas do mês e os últimos lançamentos, sempre com sinal e ícone. */
export function MonthScreen() {
  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-3.5">
        <FlowBar label="Entradas" cents={monthIncomeCents} direction="in" share={100} />
        <FlowBar label="Saídas" cents={monthExpenseCents} direction="out" share={monthExpenseShare} />
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground">Últimos lançamentos</p>
        <ul className="mt-1 divide-y divide-border" aria-label="Últimos lançamentos">
          {recentTransactions.map((transaction) => (
            <li key={transaction.title} className="flex items-center gap-3 py-2">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted">
                <transaction.icon className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{transaction.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{transaction.category}</span>
              </span>
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  transaction.direction === "in" ? "text-income" : "text-expense",
                )}
              >
                {formatSignedCurrency(transaction.cents, transaction.direction)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

type FlowBarProps = { label: string; cents: number; direction: "in" | "out"; share: number };

function FlowBar({ label, cents, direction, share }: FlowBarProps) {
  const Icon = direction === "in" ? ArrowDownLeft : ArrowUpRight;
  const tone = direction === "in" ? "text-income" : "text-expense";

  return (
    <div>
      <p className="flex items-center gap-2 text-sm">
        <Icon className={cn("size-4", tone)} aria-hidden="true" />
        <span className="flex-1 font-medium">{label}</span>
        <span className={cn("font-semibold tabular-nums", tone)}>{formatSignedCurrency(cents, direction)}</span>
      </p>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div
          className={cn("grow-x h-full rounded-full", direction === "in" ? "bg-income" : "bg-expense")}
          style={{ width: `${share}%` }}
        />
      </div>
    </div>
  );
}
