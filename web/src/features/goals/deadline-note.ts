import { formatCurrency } from "@/lib/utils/currency";
import { formatDate, formatMonthName } from "@/lib/utils/date";

import type { Goal } from "./types";

/**
 * RN6: "Guarde R$ X por mês até junho de 2027" com prazo e meta aberta; "Prazo encerrado em
 * 10/06/2026" quando o prazo passou; nada sem prazo. Devolve `null` para a tela decidir se mostra.
 */
export function goalDeadlineNote(goal: Goal): string | null {
  if (goal.deadline === null) return null;
  if (goal.status === "reached") return `Prazo: ${formatMonthName(goal.deadline.slice(0, 7))}`;
  if (goal.deadlinePassed) return `Prazo encerrado em ${formatDate(goal.deadline)}`;
  if (goal.monthlyPaceCents === null) return `Prazo: ${formatMonthName(goal.deadline.slice(0, 7))}`;
  return `Guarde ${formatCurrency(goal.monthlyPaceCents)} por mês até ${formatMonthName(goal.deadline.slice(0, 7))}`;
}
