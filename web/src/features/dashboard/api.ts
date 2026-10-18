import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";

/** Gasto de uma categoria no mês. Sem `categoryId` = "Sem categoria" (RN4 da spec 005). */
export type CategorySpending = {
  categoryId: string | null;
  name: string | null;
  color: string | null;
  icon: string | null;
  amountCents: number;
};

/** O Início (spec 005). Todos os números vêm somados do banco (RN5). */
export type Dashboard = {
  month: string;
  accountCount: number;
  creditCardCount: number;
  /** Corrente, poupança e dinheiro; o cartão fica fora (RN1). Pode ser negativo. */
  totalBalanceCents: number;
  /** Positivo quando há dívida (RN2). */
  creditCardDebtCents: number;
  incomeCents: number;
  expenseCents: number;
  /** Receitas − despesas, calculado no banco (RN3). */
  netCents: number;
  categories: CategorySpending[];
};

/** Invalidado por toda mutação de conta, categoria e transação (invalidateMoney). */
export function useDashboard(month: string) {
  return useQuery({
    queryKey: ["dashboard", month],
    queryFn: ({ signal }) => api<Dashboard>(`/api/dashboard?month=${encodeURIComponent(month)}`, { signal }),
    placeholderData: keepPreviousData,
  });
}
