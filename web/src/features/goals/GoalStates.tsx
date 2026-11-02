import { Plus, Target } from "lucide-react";
import { Link } from "react-router";
import { cn } from "cn";

import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/auth/routes";

/** Estado vazio de /metas: diz para que serve e já oferece a saída. */
export function EmptyGoals() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <Target className="size-6" aria-hidden="true" />
      </span>
      <h2 className="text-lg font-semibold">Você ainda não tem metas</h2>
      <p className="max-w-sm text-muted-foreground">
        Dê um nome e um valor ao que você quer conquistar — uma viagem, a reserva de emergência, uma compra grande — e
        registre o quanto já guardou.
      </p>
      <Link to={ROUTES.newGoal} className={cn(buttonVariants(), "mt-1 h-11 px-5 text-base")}>
        <Plus aria-hidden="true" />
        Criar minha primeira meta
      </Link>
    </div>
  );
}

/** Carregando a lista: um cartão em esqueleto por meta, sem número falso. */
export function GoalListSkeleton({ count = 3, label = "Carregando suas metas…" }: { count?: number; label?: string }) {
  return (
    <div aria-busy="true" className="space-y-3">
      <span role="status" className="sr-only">
        {label}
      </span>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="space-y-3 rounded-xl border border-border bg-card p-4">
          <Skeleton className="h-5 w-2/5" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-2.5 w-full rounded-full" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}
