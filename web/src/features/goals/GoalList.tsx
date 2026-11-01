import { LoadError } from "@/components/shared/LoadError";

import { useGoals } from "./api";
import { GoalCard } from "./GoalCard";
import { EmptyGoals, GoalListSkeleton } from "./GoalStates";
import { isOpen, type Goal } from "./types";

/**
 * Lista de /metas com os 4 estados. A ordem (RN8: em andamento primeiro, prazo mais próximo
 * primeiro, atingidas no fim) vem pronta da API; aqui só se separam as duas seções.
 */
export function GoalList() {
  const goals = useGoals();

  if (goals.isPending) return <GoalListSkeleton />;
  if (goals.isError) {
    return (
      <LoadError
        title="Não foi possível carregar suas metas"
        message="Confira sua conexão e tente de novo em instantes."
        onRetry={() => void goals.refetch()}
        isRetrying={goals.isFetching}
      />
    );
  }
  if (goals.data.length === 0) return <EmptyGoals />;

  const open = goals.data.filter(isOpen);
  const reached = goals.data.filter((goal) => !isOpen(goal));

  return (
    <div className="space-y-6">
      {open.length > 0 ? <GoalSection id="em-andamento" title="Em andamento" goals={open} /> : null}
      {reached.length > 0 ? <GoalSection id="atingidas" title="Atingidas" goals={reached} /> : null}
    </div>
  );
}

function GoalSection({ id, title, goals }: { id: string; title: string; goals: Goal[] }) {
  const headingId = `section-${id}`;
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="mb-2 px-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {title}
      </h2>
      {/* No desktop os cartões se dividem em duas colunas: um só por linha deixaria metade da tela vazia. */}
      <ul className="grid gap-3 lg:grid-cols-2 lg:items-start">
        {goals.map((goal) => (
          <li key={goal.id}>
            <GoalCard goal={goal} />
          </li>
        ))}
      </ul>
    </section>
  );
}
