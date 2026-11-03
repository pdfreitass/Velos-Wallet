import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Link, useSearchParams } from "react-router";

import { LoadError } from "@/components/shared/LoadError";
import { useSimulationBase } from "@/features/simulation/api";
import { CategoryPicker } from "@/features/simulation/CategoryPicker";
import { CutPicker } from "@/features/simulation/CutPicker";
import { SimulationResult } from "@/features/simulation/SimulationResult";
import { NotEnoughData, SimulationSkeleton } from "@/features/simulation/SimulationStates";
import { categoryKey, type CategoryAverage } from "@/features/simulation/types";
import { ROUTES } from "@/lib/auth/routes";

const TITLE = "E se você não tivesse gastado?";

/** /simular (spec 012). */
export function SimulationPage() {
  const base = useSimulationBase();

  return (
    <div className="mx-auto max-w-2xl lg:mx-0">
      <title>Simulação · Velos Wallet</title>
      <Link
        to={ROUTES.home}
        className="-ml-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-5" aria-hidden="true" />
        Início
      </Link>
      <h1 className="mt-2 mb-6 text-3xl font-semibold tracking-tight">{TITLE}</h1>

      {base.isPending ? (
        <SimulationSkeleton />
      ) : base.isError ? (
        <LoadError
          title="Não foi possível carregar seus gastos"
          message="Confira sua conexão e tente de novo em instantes."
          onRetry={() => void base.refetch()}
          isRetrying={base.isRefetching}
        />
      ) : base.data.categories.length === 0 ? (
        <NotEnoughData windowMonths={base.data.windowMonths} />
      ) : (
        <Simulator categories={base.data.categories} windowMonths={base.data.windowMonths} />
      )}
    </div>
  );
}

/**
 * Só monta com pelo menos uma categoria, então o estado inicial nunca é indefinido. Tudo daqui
 * para baixo é cálculo em memória: mover o percentual não vai à rede (CA6).
 */
function Simulator({ categories, windowMonths }: { categories: CategoryAverage[]; windowMonths: number }) {
  const [params] = useSearchParams();

  // `?categoria=<id>` abre já na categoria escolhida no Início; sem ela, a de maior gasto, que é a
  // primeira (a API já ordena).
  const asked = params.get("categoria");
  const [category, setCategory] = useState<CategoryAverage>(
    () => categories.find((item) => categoryKey(item) === asked) ?? categories[0],
  );
  const [percent, setPercent] = useState(20);

  return (
    <div className="space-y-4">
      <div className="space-y-5 rounded-xl border border-border bg-card p-5">
        <CategoryPicker categories={categories} value={category} onChange={setCategory} />
        <CutPicker value={percent} onChange={setPercent} />
      </div>

      <SimulationResult category={category} percent={percent} />

      <p className="px-1 text-sm text-muted-foreground">
        A conta usa a média dos seus gastos nos últimos {windowMonths} meses fechados. O mês que está correndo não
        entra, para o resultado não mudar sozinho todo dia 1º.
      </p>
    </div>
  );
}
