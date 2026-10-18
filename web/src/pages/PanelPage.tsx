import { Plus } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { cn } from "cn";

import { LoadError } from "@/components/shared/LoadError";
import { buttonVariants } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/api";
import { useDashboard, type Dashboard } from "@/features/dashboard/api";
import { BalanceCards } from "@/features/dashboard/BalanceCards";
import { CategorySpending } from "@/features/dashboard/CategorySpending";
import { DashboardSkeleton, FirstSteps } from "@/features/dashboard/DashboardStates";
import { MonthSummary } from "@/features/dashboard/MonthSummary";
import { MonthSwitcher } from "@/features/transactions/MonthSwitcher";
import { MONTH_PARAM } from "@/features/transactions/types";
import { ROUTES } from "@/lib/auth/routes";
import { currentMonthKey, isMonthKey } from "@/lib/utils/date";

/**
 * Início = dashboard (spec 005). Saldos de hoje à esquerda; o mês (com ‹ › e `?mes=`) e os gastos
 * por categoria à direita no desktop. A casca (navegação, tema e Sair) vem do AppLayout.
 */
export function PanelPage() {
  const me = useCurrentUser();
  const firstName = me.data?.name.split(" ")[0] ?? "";
  const [params, setParams] = useSearchParams();
  const monthParam = params.get(MONTH_PARAM);
  const month = isMonthKey(monthParam) ? monthParam : currentMonthKey();
  const dashboard = useDashboard(month);

  return (
    <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-5xl">
      <title>Início · Velos Wallet</title>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Olá, {firstName}</h1>
        <Link to={ROUTES.newTransaction} className={cn(buttonVariants(), "h-11 px-4 text-base lg:hidden")}>
          <Plus aria-hidden="true" />
          Lançar
          <span className="sr-only"> nova transação</span>
        </Link>
      </div>

      {dashboard.isPending ? (
        <DashboardSkeleton />
      ) : dashboard.isError ? (
        <LoadError
          title="Não foi possível carregar o resumo"
          message="Confira sua conexão e tente de novo em instantes."
          onRetry={() => void dashboard.refetch()}
          isRetrying={dashboard.isFetching}
        />
      ) : dashboard.data.accountCount + dashboard.data.creditCardCount === 0 ? (
        <FirstSteps />
      ) : (
        <DashboardContent
          data={dashboard.data}
          month={month}
          isStale={dashboard.isPlaceholderData}
          onMonthChange={(value) => setParams({ [MONTH_PARAM]: value }, { replace: true })}
        />
      )}
    </div>
  );
}

type DashboardContentProps = {
  data: Dashboard;
  month: string;
  isStale: boolean;
  onMonthChange: (month: string) => void;
};

function DashboardContent({ data, month, isStale, onMonthChange }: DashboardContentProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <BalanceCards data={data} />
      <div className={cn("space-y-3 transition-opacity", isStale && "opacity-60")} aria-busy={isStale}>
        <MonthSwitcher month={month} onChange={onMonthChange} />
        <MonthSummary data={data} />
        <CategorySpending data={data} />
      </div>
    </div>
  );
}
