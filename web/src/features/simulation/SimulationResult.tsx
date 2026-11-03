import { Info, Target } from "lucide-react";
import { Link } from "react-router";
import { cn } from "cn";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/auth/routes";
import { formatCurrency } from "@/lib/utils/currency";

import { monthlySavingCents, projectedCents } from "./simulation-math";
import { FEW_MONTHS, type CategoryAverage } from "./types";

type SimulationResultProps = { category: CategoryAverage; percent: number };

/**
 * RN3: projeção não é promessa. Todo valor de 6 e 12 meses vem com o "se" visível — é o que
 * aconteceria caso o corte se mantivesse, não o que vai acontecer.
 */
export function SimulationResult({ category, percent }: SimulationResultProps) {
  const monthly = monthlySavingCents(category.averageCents, percent);
  const nome = category.name ?? "Sem categoria";

  return (
    <section aria-labelledby="simulacao-resultado" className="space-y-4 rounded-xl border border-border bg-card p-5">
      <h2 id="simulacao-resultado" className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        Se você cortasse {percent}% de {nome}
      </h2>

      {/* aria-live: o número muda sem recarregar a página, e o leitor de tela precisa de saber (CA-a11y). */}
      <p aria-live="polite" className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-4xl font-semibold tracking-tight text-income tabular-nums">
          +{formatCurrency(monthly)}
        </span>
        <span className="text-muted-foreground">sobrariam por mês</span>
      </p>

      <dl className="grid grid-cols-2 gap-3 border-t border-border pt-4">
        <Projection months={6} cents={projectedCents(monthly, 6)} />
        <Projection months={12} cents={projectedCents(monthly, 12)} />
      </dl>

      <p className="text-sm text-muted-foreground">
        Os valores de 6 e 12 meses são o que sobraria <strong className="font-semibold">se</strong> o corte se
        mantivesse todo esse tempo. É uma simulação, não uma previsão.
      </p>

      {category.monthsCounted < FEW_MONTHS ? <FewMonths months={category.monthsCounted} /> : null}

      <Link
        to={`${ROUTES.newGoal}?nome=${encodeURIComponent(`Economia em ${nome}`)}&valor=${projectedCents(monthly, 12)}`}
        className={cn(buttonVariants(), "h-12 w-full text-base")}
      >
        <Target aria-hidden="true" />
        Transformar em meta
      </Link>
    </section>
  );
}

function Projection({ months, cents }: { months: number; cents: number }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-sm text-muted-foreground">Em {months} meses</dt>
      <dd className="text-xl font-semibold text-income tabular-nums">+{formatCurrency(cents)}</dd>
    </div>
  );
}

/** RN5: pouco dado é dito, não escondido. */
function FewMonths({ months }: { months: number }) {
  return (
    <p className="flex items-start gap-2 rounded-lg bg-secondary px-3 py-2.5 text-sm text-secondary-foreground">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>
        Esta média vem de {months === 1 ? "um mês só" : `${months} meses`} de gastos. Com mais tempo de uso, ela fica
        mais perto da sua realidade.
      </span>
    </p>
  );
}
