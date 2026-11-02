import { CircleAlert, PartyPopper, Plus, Target } from "lucide-react";
import { Link } from "react-router";
import { cn } from "cn";

import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/auth/routes";

import { useGoals } from "./api";
import { GoalCard } from "./GoalCard";
import { HOME_GOALS_LIMIT, isOpen } from "./types";

/**
 * Bloco "Metas" do Início (RN9): até 3 metas em andamento, na ordem que a API manda (RN8). Usa a
 * MESMA query `["goals"]` da tela de Metas, então aportar ou excluir atualiza os dois (CA4).
 * Erro aqui não derruba o resto do painel: fica só uma linha neste bloco.
 */
export function GoalsHomeBlock() {
  const goals = useGoals();
  const open = goals.data?.filter(isOpen) ?? [];

  return (
    <section aria-labelledby="metas-inicio" className="space-y-2">
      <div className="flex items-baseline justify-between gap-3 px-1">
        <h2 id="metas-inicio" className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Metas
        </h2>
        {goals.isSuccess && goals.data.length > 0 ? (
          <Link
            to={ROUTES.goals}
            className="-mr-2 inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-medium text-foreground underline underline-offset-3 outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Ver todas
          </Link>
        ) : null}
      </div>

      {goals.isPending ? (
        <HomeBlockSkeleton />
      ) : goals.isError ? (
        <p role="alert" className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <CircleAlert className="size-4 shrink-0 text-destructive" aria-hidden="true" />
          Não foi possível carregar suas metas agora.
        </p>
      ) : goals.data.length === 0 ? (
        <FirstGoalInvite />
      ) : open.length === 0 ? (
        <AllReached />
      ) : (
        <ul className="space-y-2">
          {open.slice(0, HOME_GOALS_LIMIT).map((goal) => (
            <li key={goal.id}>
              <GoalCard goal={goal} size="sm" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function FirstGoalInvite() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-card p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <Target className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">Crie sua primeira meta</p>
        <p className="text-sm text-muted-foreground">Dê um nome e um valor ao que você quer conquistar.</p>
      </div>
      <Link to={ROUTES.newGoal} className={cn(buttonVariants({ size: "icon" }), "shrink-0")} aria-label="Nova meta">
        <Plus aria-hidden="true" />
      </Link>
    </div>
  );
}

function AllReached() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-income">
        <PartyPopper className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">Todas as suas metas foram atingidas</p>
        <p className="text-sm text-muted-foreground">Que tal a próxima?</p>
      </div>
      <Link to={ROUTES.newGoal} className={cn(buttonVariants({ size: "icon" }), "shrink-0")} aria-label="Nova meta">
        <Plus aria-hidden="true" />
      </Link>
    </div>
  );
}

function HomeBlockSkeleton() {
  return (
    <div aria-busy="true" className="space-y-2">
      <span role="status" className="sr-only">
        Carregando suas metas…
      </span>
      {[0, 1].map((i) => (
        <div key={i} className="space-y-2.5 rounded-xl border border-border bg-card p-3.5">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}
