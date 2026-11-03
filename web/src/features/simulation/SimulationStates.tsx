import { CalendarRange } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

/** Carregando: reserva o espaço da escolha e do resultado, sem número falso. */
export function SimulationSkeleton() {
  return (
    <div aria-busy="true" className="space-y-4">
      <span role="status" className="sr-only">
        Carregando seus gastos…
      </span>
      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
      <div className="space-y-3 rounded-xl border border-border bg-card p-6">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-9 w-2/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
    </div>
  );
}

/**
 * RN4: sem nenhum mês completo com despesa, não há o que simular — e a tela diz isso em vez de
 * mostrar um número fraco. É o estado normal de quem acabou de começar.
 */
export function NotEnoughData({ windowMonths }: { windowMonths: number }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <CalendarRange className="size-6" aria-hidden="true" />
      </span>
      <h2 className="text-lg font-semibold">Ainda não dá para simular</h2>
      <p className="max-w-sm text-muted-foreground">
        A simulação usa a média dos seus gastos nos últimos {windowMonths} meses fechados, e o mês que está correndo
        não entra na conta. Registre suas despesas por mais um tempo e volte aqui.
      </p>
    </div>
  );
}
