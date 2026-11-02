import { useState } from "react";
import { CalendarClock, Pencil, Plus, TriangleAlert } from "lucide-react";
import { Link } from "react-router";
import { cn } from "cn";

import { Button, buttonVariants } from "@/components/ui/button";
import { editGoalPath } from "@/lib/auth/routes";

import { ContributionDialog } from "./ContributionDialog";
import { ContributionList } from "./ContributionList";
import { DeleteGoalDialog } from "./DeleteGoalDialog";
import { goalDeadlineNote } from "./deadline-note";
import { GoalProgress } from "./GoalProgress";
import type { GoalWithContributions } from "./types";

/** Detalhe da meta: progresso grande, ritmo da RN6, aportes e as ações da meta. */
export function GoalDetail({ data }: { data: GoalWithContributions }) {
  const { goal, contributions } = data;
  const [adding, setAdding] = useState(false);
  const note = goalDeadlineNote(goal);

  return (
    <div className="space-y-6">
      <section aria-labelledby="progresso" className="rounded-xl border border-border bg-card p-4 lg:p-5">
        <h2 id="progresso" className="sr-only">
          Progresso da meta
        </h2>
        <GoalProgress goal={goal} />
        {note ? (
          <p
            className={cn(
              "mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-sm",
              goal.deadlinePassed ? "text-destructive" : "text-muted-foreground",
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
      </section>

      <Button type="button" className="h-12 w-full text-base" onClick={() => setAdding(true)}>
        <Plus aria-hidden="true" />
        Novo aporte
      </Button>

      <section aria-labelledby="aportes" className="space-y-2">
        <h2 id="aportes" className="px-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {contributions.length === 0 ? "Aportes" : `Aportes (${contributions.length})`}
        </h2>
        <ContributionList goalId={goal.id} contributions={contributions} />
      </section>

      <div className="space-y-2 border-t border-border pt-4">
        <Link to={editGoalPath(goal.id)} className={cn(buttonVariants({ variant: "outline" }), "h-11 w-full text-base")}>
          <Pencil aria-hidden="true" />
          Editar meta
        </Link>
        <DeleteGoalDialog goal={goal} />
      </div>

      {adding ? <ContributionDialog goalId={goal.id} open onOpenChange={setAdding} /> : null}
    </div>
  );
}
