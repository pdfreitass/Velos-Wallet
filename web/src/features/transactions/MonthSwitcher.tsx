import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { currentMonthKey, formatMonthLabel, formatMonthName, shiftMonth } from "@/lib/utils/date";

type MonthSwitcherProps = { month: string; onChange: (month: string) => void };

/**
 * ‹ Outubro de 2026 › (CA7). Não passa do mês atual: transação nunca é no futuro (RN4), então um
 * mês à frente estaria sempre vazio.
 */
export function MonthSwitcher({ month, onChange }: MonthSwitcherProps) {
  const previous = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);
  const isCurrent = month >= currentMonthKey();

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-11"
        aria-label={`Mês anterior, ${formatMonthName(previous)}`}
        onClick={() => onChange(previous)}
      >
        <ChevronLeft className="size-5" aria-hidden="true" />
      </Button>
      <h2 className="text-base font-semibold" aria-live="polite">
        {formatMonthLabel(`${month}-01`)}
      </h2>
      <Button
        variant="ghost"
        size="icon"
        className="size-11"
        aria-label={`Próximo mês, ${formatMonthName(next)}`}
        disabled={isCurrent}
        onClick={() => onChange(next)}
      >
        <ChevronRight className="size-5" aria-hidden="true" />
      </Button>
    </div>
  );
}
