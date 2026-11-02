/** RN5 da spec 006. Mesmos valores do enum GoalStatus da API (camelCase). */
export const GOAL_STATUSES = ["notStarted", "inProgress", "reached"] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];

/**
 * A meta como a API entrega (`GoalSummary`): o juntado, a contagem, a falta e o excedente vêm
 * somados do banco (RN4); o estado e o ritmo vêm calculados com o "hoje" de São Paulo (RN5, RN6).
 */
export type Goal = {
  id: string;
  name: string;
  targetCents: number;
  /** "yyyy-MM-dd" ou null (prazo é opcional, RN1). */
  deadline: string | null;
  currentCents: number;
  contributionCount: number;
  /** Alvo − juntado, nunca abaixo de zero (RN4). */
  remainingCents: number;
  /** Juntado − alvo, nunca abaixo de zero: o "além da meta" da RN5. */
  excessCents: number;
  status: GoalStatus;
  /** Quanto guardar por mês até o prazo; null sem prazo ou com o prazo vencido (RN6). */
  monthlyPaceCents: number | null;
  /** Prazo vencido com a meta ainda não atingida (RN6). */
  deadlinePassed: boolean;
};

export type Contribution = {
  id: string;
  amountCents: number;
  /** "yyyy-MM-dd". */
  date: string;
};

/** `GET /api/goals/{id}`: a meta e os aportes, do mais recente para o mais antigo. */
export type GoalWithContributions = {
  goal: Goal;
  contributions: Contribution[];
};

/** RN9: o Início mostra até 3 metas em andamento (as não atingidas), na ordem que a API já manda. */
export const HOME_GOALS_LIMIT = 3;

export function isOpen(goal: Goal): boolean {
  return goal.status !== "reached";
}
