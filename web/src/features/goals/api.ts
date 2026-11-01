import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import { api, ApiError } from "@/lib/api/client";

import type { Goal, GoalWithContributions } from "./types";

const goalsKey = ["goals"] as const;
const goalKey = (id: string) => ["goals", id] as const;

export type GoalRequest = { name: string; targetCents: number; deadline: string | null };
export type ContributionRequest = { amountCents: number; date: string };

/**
 * Aporte não mexe em saldo nenhum (RN3, CA7): as mutações de metas invalidam só `["goals"]` —
 * nunca `invalidateMoney`. A lista e o bloco do Início usam a MESMA query, então os dois se
 * atualizam juntos (CA4).
 */
function invalidateGoals(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: goalsKey });
}

/**
 * 404 numa mutação significa que a meta (ou o aporte) sumiu — excluída em outra aba, por exemplo.
 * Recarregar faz a tela cair no mesmo "não encontrada" do carregamento, em vez de seguir mostrando
 * o cache antigo atrás do diálogo.
 */
function refetchWhenGone(queryClient: QueryClient) {
  return (error: unknown) => {
    if (error instanceof ApiError && error.status === 404) void invalidateGoals(queryClient);
  };
}

export function useGoals() {
  return useQuery({
    queryKey: goalsKey,
    queryFn: ({ signal }) => api<Goal[]>("/api/goals", { signal }),
  });
}

export function useGoal(id: string) {
  return useQuery({
    queryKey: goalKey(id),
    queryFn: ({ signal }) => api<GoalWithContributions>(`/api/goals/${encodeURIComponent(id)}`, { signal }),
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: GoalRequest) => api<{ id: string }>("/api/goals", { method: "POST", body }),
    onSuccess: () => invalidateGoals(queryClient),
  });
}

export function useUpdateGoal(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: GoalRequest) => api(`/api/goals/${encodeURIComponent(id)}`, { method: "PUT", body }),
    onSuccess: () => invalidateGoals(queryClient),
    onError: refetchWhenGone(queryClient),
  });
}

/**
 * A meta excluída sai do cache sem ser buscada de novo (daria 404 com a tela ainda aberta); a
 * lista e o Início recarregam sem ela (CA5).
 */
export function useDeleteGoal(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api(`/api/goals/${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: goalKey(id) });
      return queryClient.invalidateQueries({
        queryKey: goalsKey,
        predicate: (query) => query.queryKey[1] !== id,
      });
    },
    onError: refetchWhenGone(queryClient),
  });
}

export function useAddContribution(goalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ContributionRequest) =>
      api<{ id: string }>(`/api/goals/${encodeURIComponent(goalId)}/contributions`, { method: "POST", body }),
    onSuccess: () => invalidateGoals(queryClient),
    onError: refetchWhenGone(queryClient),
  });
}

export function useUpdateContribution(goalId: string, contributionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ContributionRequest) =>
      api(
        `/api/goals/${encodeURIComponent(goalId)}/contributions/${encodeURIComponent(contributionId)}`,
        { method: "PUT", body },
      ),
    onSuccess: () => invalidateGoals(queryClient),
    onError: refetchWhenGone(queryClient),
  });
}

export function useDeleteContribution(goalId: string, contributionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api(
        `/api/goals/${encodeURIComponent(goalId)}/contributions/${encodeURIComponent(contributionId)}`,
        { method: "DELETE" },
      ),
    onSuccess: () => invalidateGoals(queryClient),
    onError: refetchWhenGone(queryClient),
  });
}
