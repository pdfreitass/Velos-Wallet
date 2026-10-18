import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";

import type { TransactionDetail, TransactionMonth, TransactionType } from "./types";

const transactionsKey = ["transactions"] as const;
const monthKey = (month: string, categoryId: string | null) => ["transactions", "month", month, categoryId] as const;
const transactionKey = (id: string) => ["transactions", "item", id] as const;

export type SaveTransactionRequest = {
  type: TransactionType;
  amountCents: number;
  date: string;
  description: string | null;
  accountId: string;
  transferAccountId: string | null;
  categoryId: string | null;
};

export function useTransactionMonth(month: string, categoryId: string | null) {
  const params = new URLSearchParams({ month });
  if (categoryId) params.set("categoryId", categoryId);

  return useQuery({
    queryKey: monthKey(month, categoryId),
    queryFn: ({ signal }) => api<TransactionMonth>(`/api/transactions?${params.toString()}`, { signal }),
    // Trocar de mês ou de filtro mantém a lista anterior na tela até a nova chegar (sem piscar o skeleton).
    placeholderData: keepPreviousData,
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: transactionKey(id),
    queryFn: ({ signal }) => api<TransactionDetail>(`/api/transactions/${encodeURIComponent(id)}`, { signal }),
  });
}

/** Toda mutação muda o saldo das contas e os totais do mês: as duas listas são buscadas de novo. */
function invalidateMoney(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: transactionsKey }),
    queryClient.invalidateQueries({ queryKey: ["accounts"] }),
  ]);
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SaveTransactionRequest) =>
      api<{ id: string }>("/api/transactions", { method: "POST", body }),
    onSuccess: () => invalidateMoney(queryClient),
  });
}

export function useUpdateTransaction(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SaveTransactionRequest) =>
      api(`/api/transactions/${encodeURIComponent(id)}`, { method: "PUT", body }),
    onSuccess: () => invalidateMoney(queryClient),
  });
}

/** A excluída sai do cache sem ser buscada de novo (daria 404 com a tela ainda aberta, L29). */
export function useDeleteTransaction(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api(`/api/transactions/${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: transactionKey(id) });
      return invalidateMoney(queryClient);
    },
  });
}
