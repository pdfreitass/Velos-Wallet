import { ChevronLeft } from "lucide-react";
import { Link, useParams } from "react-router";

import { LoadError } from "@/components/shared/LoadError";
import { useGoal } from "@/features/goals/api";
import { GoalDetail } from "@/features/goals/GoalDetail";
import { GoalListSkeleton } from "@/features/goals/GoalStates";
import { ApiError } from "@/lib/api/client";
import { ROUTES } from "@/lib/auth/routes";
import { NotFoundPage } from "@/pages/NotFoundPage";

/**
 * /metas/:id. Inexistente, de outra pessoa ou id inválido: o mesmo 404 da API e o mesmo
 * "não encontrada" na tela (CA-seg).
 */
export function GoalDetailPage() {
  const { id = "" } = useParams();
  const goal = useGoal(id);

  if (goal.isError && goal.error instanceof ApiError && goal.error.status === 404) {
    return <NotFoundPage title="Meta não encontrada" backTo={ROUTES.goals} backLabel="Ver minhas metas" />;
  }

  return (
    <div className="mx-auto max-w-lg lg:mx-0">
      <title>{goal.data ? `${goal.data.goal.name} · Velos Wallet` : "Meta · Velos Wallet"}</title>
      <Link
        to={ROUTES.goals}
        className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ChevronLeft className="size-5" aria-hidden="true" />
        Metas
      </Link>

      {goal.isPending ? (
        <>
          <h1 className="mt-2 mb-6 text-3xl font-semibold tracking-tight">Meta</h1>
          <GoalListSkeleton count={1} label="Carregando a meta…" />
        </>
      ) : goal.isError ? (
        <>
          <h1 className="mt-2 mb-6 text-3xl font-semibold tracking-tight">Meta</h1>
          <LoadError
            title="Não foi possível carregar a meta"
            message="Confira sua conexão e tente de novo em instantes."
            onRetry={() => void goal.refetch()}
            isRetrying={goal.isFetching}
          />
        </>
      ) : (
        <>
          <h1 className="mt-2 mb-6 text-3xl font-semibold tracking-tight break-words">{goal.data.goal.name}</h1>
          <GoalDetail data={goal.data} />
        </>
      )}
    </div>
  );
}
