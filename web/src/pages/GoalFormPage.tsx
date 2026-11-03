import { addMonths } from "date-fns";
import { useParams, useSearchParams } from "react-router";

import { FormPageShell, FormSkeleton } from "@/components/shared/FormPageShell";
import { LoadError } from "@/components/shared/LoadError";
import { useGoal } from "@/features/goals/api";
import { GoalForm, type GoalSuggestion } from "@/features/goals/GoalForm";
import { ApiError } from "@/lib/api/client";
import { goalPath, ROUTES } from "@/lib/auth/routes";
import { MAX_MONEY_CENTS } from "@/lib/utils/currency";
import { toDbDate } from "@/lib/utils/date";
import { GOAL_NAME_MAX_LENGTH } from "@/lib/validations/goals";
import { NotFoundPage } from "@/pages/NotFoundPage";

/**
 * /metas/nova. Aceita `?nome=` e `?valor=` (em centavos) para vir preenchida da simulação de
 * corte (RN8 da spec 012) — sem eles, é o formulário em branco de sempre. Nada é salvo aqui até
 * o usuário confirmar.
 */
export function NewGoalPage() {
  const [params] = useSearchParams();

  return (
    <FormPageShell title="Nova meta" backTo={ROUTES.goals} backLabel="Metas">
      <GoalForm suggestion={suggestionFrom(params)} />
    </FormPageShell>
  );
}

/** Parâmetro ausente, vazio ou fora da faixa é ignorado: a tela cai no formulário em branco. */
function suggestionFrom(params: URLSearchParams): GoalSuggestion | undefined {
  const name = params.get("nome")?.trim();
  const cents = Number(params.get("valor"));

  if (!name || name.length > GOAL_NAME_MAX_LENGTH) return undefined;
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > MAX_MONEY_CENTS) return undefined;

  // RN8: 12 meses é a sugestão, e o usuário muda à vontade.
  return { name, targetCents: cents, deadline: toDbDate(addMonths(new Date(), 12)) };
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
