import type { CSSProperties } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "cn";

import { transactionDays, type ExampleTransaction } from "@/features/showcase/showcase-data";
import { formatSignedCurrency } from "@/lib/utils/currency";
import { currentMonthKey, formatMonthLabel } from "@/lib/utils/date";

/**
 * /transacoes em miniatura (spec 004): o seletor de mês e a lista agrupada por dia, cada linha
 * com o ícone da categoria, "categoria · conta" e o valor com sinal e cor. O mês é o atual, para
 * o exemplo não envelhecer; as setas são só desenho.
 */
export function TransactionsScreen() {
  const month = formatMonthLabel(`${currentMonthKey()}-01`);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-2 py-1.5" aria-hidden="true">
        <ChevronLeft className="size-4 text-muted-foreground" />
        <span className="text-xs font-semibold">{month}</span>
        <ChevronRight className="size-4 text-muted-foreground/40" />
      </div>

      {transactionDays.map((day) => (
        <div key={day.label}>
          <p className="mb-1 px-1 text-[0.65rem] font-semibold tracking-wider text-muted-foreground uppercase">
            {day.label}
          </p>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card" aria-label={day.label}>
            {day.transactions.map((transaction) => (
              <TransactionRow key={transaction.title} transaction={transaction} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function TransactionRow({ transaction }: { transaction: ExampleTransaction }) {
  return (
    <li className="flex items-center gap-2.5 px-2.5 py-2 text-card-foreground">
      <span
        aria-hidden="true"
        style={{ "--category": transaction.color } as CSSProperties}
        className="grid size-8 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--category)_15%,transparent)] text-(--category)"
      >
        <transaction.icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{transaction.title}</span>
        <span className="block truncate text-xs text-muted-foreground">{transaction.subtitle}</span>
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
  );
}
