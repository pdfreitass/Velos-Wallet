import { useParams } from "react-router";

import { FormPageShell, FormSkeleton } from "@/components/shared/FormPageShell";
import { LoadError } from "@/components/shared/LoadError";
import { useGoal } from "@/features/goals/api";
import { GoalForm } from "@/features/goals/GoalForm";
import { ApiError } from "@/lib/api/client";
import { goalPath, ROUTES } from "@/lib/auth/routes";
import { NotFoundPage } from "@/pages/NotFoundPage";

/** /metas/nova */
export function NewGoalPage() {
  return (
    <FormPageShell title="Nova meta" backTo={ROUTES.goals} backLabel="Metas">
      <GoalForm />
    </FormPageShell>
  );
}

/**
 * /metas/:id/editar. Inexistente, de outra pessoa ou id inválido: a API responde o mesmo 404, e a
 * tela mostra o mesmo "não encontrada" (CA-seg), sem revelar se a meta existe.
 */
export function EditGoalPage() {
  const { id = "" } = useParams();
  const goal = useGoal(id);

  if (goal.isError && goal.error instanceof ApiError && goal.error.status === 404) {
    return <NotFoundPage title="Meta não encontrada" backTo={ROUTES.goals} backLabel="Ver minhas metas" />;
  }

  return (
    <FormPageShell title="Editar meta" backTo={goalPath(id)} backLabel="Voltar para a meta">
      {goal.isPending ? (
        <FormSkeleton label="Carregando a meta…" />
      ) : goal.isError ? (
        <LoadError
          title="Não foi possível carregar a meta"
          message="Confira sua conexão e tente de novo em instantes."
          onRetry={() => void goal.refetch()}
          isRetrying={goal.isFetching}
        />
      ) : (
        <GoalForm goal={goal.data.goal} />
      )}
    </FormPageShell>
  );
}
