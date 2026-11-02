import { CalendarClock, ChevronRight, TriangleAlert } from "lucide-react";
import { Link } from "react-router";
import { cn } from "cn";

import { goalPath } from "@/lib/auth/routes";

import { goalDeadlineNote } from "./deadline-note";
import { GoalProgress } from "./GoalProgress";
import type { Goal } from "./types";

/**
 * Cartão de uma meta na lista e no Início: nome, progresso e o prazo/ritmo da RN6. O cartão inteiro
 * é o link para o detalhe (alvo bem maior que 44 px no celular).
 */
export function GoalCard({ goal, size = "md" }: { goal: Goal; size?: "sm" | "md" }) {
  const note = goalDeadlineNote(goal);

  return (
    <Link
      to={goalPath(goal.id)}
      className={cn(
        // O hover acende a borda em vez do fundo: sobre `muted` o texto de estado cairia para
        // 4,27:1 no tema claro, e aqui o cartão carrega income, muted e destructive ao mesmo tempo.
        "block rounded-xl border border-border bg-card text-card-foreground outline-none transition-colors hover:border-primary focus-visible:ring-3 focus-visible:ring-ring/50",
        size === "md" ? "p-4 lg:p-5" : "p-3.5",
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <h3 className={cn("min-w-0 flex-1 truncate font-semibold", size === "md" ? "text-base" : "text-sm")}>
          {goal.name}
        </h3>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      </div>

      <GoalProgress goal={goal} size={size} />

      {note ? (
        <p
          className={cn(
            "mt-2.5 flex items-center gap-1.5 text-muted-foreground",
            size === "md" ? "text-sm" : "text-xs",
            goal.deadlinePassed && "text-destructive",
          )}
        >
          {goal.deadlinePassed ? (
            <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
          ) : (
            <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
          )}
          {note}
        </p>
      ) : null}
    </Link>
  );
}
