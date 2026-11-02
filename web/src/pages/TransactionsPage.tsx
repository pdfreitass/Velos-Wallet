import { Plus } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { cn } from "cn";

import { buttonVariants } from "@/components/ui/button";
import { CategoryFilter } from "@/features/transactions/CategoryFilter";
import { MonthSwitcher } from "@/features/transactions/MonthSwitcher";
import { TransactionList } from "@/features/transactions/TransactionList";
import { CATEGORY_PARAM, MONTH_PARAM } from "@/features/transactions/types";
import { ROUTES } from "@/lib/auth/routes";
import { currentMonthKey, isMonthKey } from "@/lib/utils/date";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * /transacoes?mes=2026-10&categoria=<id> (spec 004, T8). O mês e o filtro ficam no endereço
 * (CA7, CA8): voltar do formulário ou recarregar mantém onde a pessoa estava. Mês inválido no
 * endereço vira o mês atual.
 */
export function TransactionsPage() {
  const [params, setParams] = useSearchParams();
  const monthParam = params.get(MONTH_PARAM);
  const month = isMonthKey(monthParam) ? monthParam : currentMonthKey();
  // Só um UUID vira filtro: qualquer outra coisa no endereço cai em "Todas as categorias".
  const categoryParam = params.get(CATEGORY_PARAM);
  const categoryId = categoryParam && UUID.test(categoryParam) ? categoryParam : null;

  function update(next: { month?: string; categoryId?: string | null }) {
    const merged = new URLSearchParams(params);
    if (next.month !== undefined) merged.set(MONTH_PARAM, next.month);
    if (next.categoryId !== undefined) {
      if (next.categoryId) merged.set(CATEGORY_PARAM, next.categoryId);
      else merged.delete(CATEGORY_PARAM);
    }
    setParams(merged, { replace: true });
  }

  return (
    <div className="mx-auto max-w-2xl lg:mx-0">
      <title>Transações · Velos Wallet</title>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Transações</h1>
        <Link to={ROUTES.newTransaction} className={cn(buttonVariants(), "h-11 px-4 text-base lg:hidden")}>
          <Plus aria-hidden="true" />
          Nova
          <span className="sr-only"> transação</span>
        </Link>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_16rem]">
        <MonthSwitcher month={month} onChange={(value) => update({ month: value })} />
        <CategoryFilter value={categoryId} onChange={(value) => update({ categoryId: value })} />
      </div>

      <TransactionList month={month} categoryId={categoryId} />
    </div>
  );
}
