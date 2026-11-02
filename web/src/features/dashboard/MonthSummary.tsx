import { ArrowDownLeft, ArrowUpRight, Scale } from "lucide-react";
import { cn } from "cn";

import { formatSignedCurrency } from "@/lib/utils/currency";

import type { Dashboard } from "./api";

/**
 * RN3: receitas, despesas e o resultado do mês (transferências fora). Cada valor tem sinal e ícone;
 * as barras comparam os dois lados, e o número continua sendo a informação (a barra é só apoio).
 */
export function MonthSummary({ data }: { data: Dashboard }) {
  const max = Math.max(data.incomeCents, data.expenseCents, 1);
  const isPositive = data.netCents >= 0;

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <Line
        label="Receitas"
        Icon={ArrowDownLeft}
        value={formatSignedCurrency(data.incomeCents, "in")}
        tone="text-income"
        bar="bg-income"
        width={(data.incomeCents / max) * 100}
      />
      <Line
        label="Despesas"
        Icon={ArrowUpRight}
        value={formatSignedCurrency(data.expenseCents, "out")}
        tone="text-expense"
        bar="bg-expense"
        width={(data.expenseCents / max) * 100}
      />
      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <span className="flex items-center gap-2 font-medium">
          <Scale className="size-4 text-muted-foreground" aria-hidden="true" />
          Resultado do mês
        </span>
        <span className={cn("text-lg font-semibold tabular-nums", isPositive ? "text-income" : "text-expense")}>
          {formatSignedCurrency(Math.abs(data.netCents), isPositive ? "in" : "out")}
        </span>
      </div>
    </div>
  );
}

type LineProps = {
  label: string;
  Icon: typeof ArrowDownLeft;
  value: string;
  tone: string;
  bar: string;
  width: number;
};

function Line({ label, Icon, value, tone, bar, width }: LineProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon className={cn("size-4", tone)} aria-hidden="true" />
          {label}
        </span>
        <span className={cn("font-semibold tabular-nums", tone)}>{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div className={cn("h-full rounded-full", bar)} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
