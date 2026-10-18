import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { invalidateMoney } from "@/features/transactions/api";

import type { Account, AccountDeletionImpact, AccountType } from "./types";

const accountsKey = ["accounts"] as const;
const accountKey = (id: string) => ["accounts", id] as const;

export type NewAccountRequest = { name: string; type: AccountType; initialBalanceCents: number };
export type AccountChangesRequest = { name: string; initialBalanceCents: number };

export function useAccounts() {
  return useQuery({
    queryKey: accountsKey,
    queryFn: ({ signal }) => api<Account[]>("/api/accounts", { signal }),
  });
}

export function useAccount(id: string) {
  return useQuery({
    queryKey: accountKey(id),
    queryFn: ({ signal }) => api<Account>(`/api/accounts/${encodeURIComponent(id)}`, { signal }),
  });
}

/** RN6: o que vai junto. Só busca com o diálogo aberto, e sempre de novo (os dados mudam). */
export function useAccountDeletionImpact(id: string, enabled: boolean) {
  return useQuery({
    queryKey: [...accountKey(id), "deletion-impact"],
    queryFn: ({ signal }) =>
      api<AccountDeletionImpact>(`/api/accounts/${encodeURIComponent(id)}/deletion-impact`, { signal }),
    enabled,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: NewAccountRequest) => api<{ id: string }>("/api/accounts", { method: "POST", body }),
    onSuccess: () => invalidateMoney(queryClient),
  });
}

export function useUpdateAccount(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AccountChangesRequest) =>
      api(`/api/accounts/${encodeURIComponent(id)}`, { method: "PUT", body }),
    onSuccess: () => invalidateMoney(queryClient),
  });
}

/**
 * Ao excluir, outras contas podem mudar de saldo (transferências, RN6): invalida a lista e as
 * outras contas. A excluída sai do cache sem ser buscada de novo (daria 404 com a tela ainda aberta).
 */
export function useDeleteAccount(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api(`/api/accounts/${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: accountKey(id) });
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: accountsKey, predicate: (query) => query.queryKey[1] !== id }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}
