import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { invalidateMoney } from "@/features/transactions/api";

import type { Category, CategoryDeletionImpact, CategoryType } from "./types";

const categoriesKey = ["categories"] as const;
const categoryKey = (id: string) => ["categories", id] as const;

export type NewCategoryRequest = { name: string; type: CategoryType; color: string; icon: string };
export type CategoryChangesRequest = { name: string; color: string; icon: string };

/** Já vêm ordenadas por tipo e nome (pt-BR) pela API. */
export function useCategories() {
  return useQuery({
    queryKey: categoriesKey,
    queryFn: ({ signal }) => api<Category[]>("/api/categories", { signal }),
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: categoryKey(id),
    queryFn: ({ signal }) => api<Category>(`/api/categories/${encodeURIComponent(id)}`, { signal }),
  });
}

/** RN11: quantas movimentações passam a "Sem categoria". Só com o diálogo aberto, sempre de novo. */
export function useCategoryDeletionImpact(id: string, enabled: boolean) {
  return useQuery({
    queryKey: [...categoryKey(id), "deletion-impact"],
    queryFn: ({ signal }) =>
      api<CategoryDeletionImpact>(`/api/categories/${encodeURIComponent(id)}/deletion-impact`, { signal }),
    enabled,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: NewCategoryRequest) => api<{ id: string }>("/api/categories", { method: "POST", body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoriesKey }),
  });
}

export function useUpdateCategory(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CategoryChangesRequest) =>
      api(`/api/categories/${encodeURIComponent(id)}`, { method: "PUT", body }),
    // O nome, a cor e o ícone aparecem nas transações e no Início.
    onSuccess: () => Promise.all([queryClient.invalidateQueries({ queryKey: categoriesKey }), invalidateMoney(queryClient)]),
  });
}

/** A excluída sai do cache sem ser buscada de novo (daria 404 com a tela ainda aberta). */
export function useDeleteCategory(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api(`/api/categories/${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: categoryKey(id) });
      // As transações dela viram "Sem categoria" (RN11) na lista e no Início.
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: categoriesKey, exact: true }),
        invalidateMoney(queryClient),
      ]);
    },
  });
}
