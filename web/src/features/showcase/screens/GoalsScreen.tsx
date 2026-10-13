import { goals } from "@/features/showcase/showcase-data";
import { formatCurrency } from "@/lib/utils/currency";

/** Metas com barra de progresso e quanto já foi guardado (progresso vem da view goal_progress). */
export function GoalsScreen() {
  return (
    <ul className="flex flex-col gap-4.5" aria-label="Metas">
      {goals.map((goal) => (
        <li key={goal.name}>
          <p className="flex items-center gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted">
              <goal.icon className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{goal.name}</span>
            <span className="text-sm font-semibold tabular-nums">{goal.percent}%</span>
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <div className="grow-x h-full rounded-full bg-income" style={{ width: `${goal.percent}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
            {formatCurrency(goal.savedCents)} de {formatCurrency(goal.targetCents)}
          </p>
        </li>
      ))}
    </ul>
  );
}
