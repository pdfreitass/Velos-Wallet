import { cn } from "cn";

import { formatCurrency } from "@/lib/utils/currency";

import type { Goal } from "./types";

/**
 * Barra de progresso do domínio **atingir** (DESIGN.md → "Barras de progresso"): `muted` em zero,
 * `primary` em andamento, `income` ao atingir — a cor NUNCA vem da porcentagem.
 *
 * A barra é `aria-hidden`: quem lê a tela com leitor de tela ouve o `X de Y` e o texto de estado,
 * que são a informação de verdade (CA-a11y). Nada depende só da cor.
 */
export function GoalProgress({ goal, size = "md" }: { goal: Goal; size?: "sm" | "md" }) {
  const percent = progressPercent(goal);

  return (
    <div className="space-y-1.5">
      <div className={cn("flex flex-wrap items-baseline justify-between gap-x-2", size === "md" && "gap-y-0.5")}>
        <p className={cn("font-semibold tabular-nums", size === "md" ? "text-lg" : "text-sm")}>
          {formatCurrency(goal.currentCents)}
          <span className="font-normal text-muted-foreground"> de {formatCurrency(goal.targetCents)}</span>
        </p>
        <p className={cn("text-muted-foreground tabular-nums", size === "md" ? "text-sm" : "text-xs")}>{percent}%</p>
      </div>

      <div
        aria-hidden="true"
        className={cn("w-full overflow-hidden rounded-full bg-muted", size === "md" ? "h-2.5" : "h-2")}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none",
            goal.status === "reached" ? "bg-income" : "bg-primary",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className={cn("font-medium", size === "md" ? "text-sm" : "text-xs")}>
        <GoalStatusText goal={goal} />
      </p>
    </div>
  );
}

/** RN5: o texto de estado, sempre visível. O excedente aparece junto do "Meta atingida". */
function GoalStatusText({ goal }: { goal: Goal }) {
  if (goal.status === "reached") {
    return (
      <>
        <span className="text-income">Meta atingida</span>
        {goal.excessCents > 0 ? (
          <span className="font-normal text-muted-foreground"> · {formatCurrency(goal.excessCents)} além da meta</span>
        ) : null}
      </>
    );
  }

  if (goal.status === "notStarted") {
    return <span className="font-normal text-muted-foreground">Comece com o primeiro aporte</span>;
  }

  return <>Faltam {formatCurrency(goal.remainingCents)}</>;
}

/**
 * 0 a 100, só para a largura da barra e o rótulo (a cor vem do estado, não daqui).
 *
 * Os extremos vêm do estado, não do arredondamento: 100% é só a meta atingida (senão R$ 7.990 de
 * R$ 8.000 mostraria a barra cheia ao lado de "Faltam R$ 10,00"), e 0% é só a meta sem nada
 * guardado (senão um primeiro aporte pequeno sumiria).
 */
function progressPercent(goal: Goal): number {
  if (goal.status === "reached") return 100;
  if (goal.currentCents <= 0 || goal.targetCents <= 0) return 0;
  return Math.min(99, Math.max(1, Math.round((goal.currentCents / goal.targetCents) * 100)));
}
