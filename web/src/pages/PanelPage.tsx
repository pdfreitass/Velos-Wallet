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
import { GoalsHomeBlock } from "@/features/goals/GoalsHomeBlock";
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
  const changeMonth = (value: string) => setParams({ [MONTH_PARAM]: value }, { replace: true });
  const greeting = firstName ? `Olá, ${firstName}` : "Olá";

  return (
    <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-5xl">
      <title>Início · Velos Wallet</title>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">{greeting}</h1>
        <Link to={ROUTES.newTransaction} className={cn(buttonVariants(), "h-11 px-4 text-base lg:hidden")}>
          <Plus aria-hidden="true" />
          Lançar
          <span className="sr-only"> nova transação</span>
        </Link>
      </div>

      {dashboard.isPending ? (
        <DashboardSkeleton />
      ) : dashboard.isError ? (
        // O seletor de mês continua na tela: se um mês falhar, dá para voltar a outro.
        <div className="space-y-3 lg:max-w-[calc(50%-0.75rem)] lg:ml-auto">
          <MonthSwitcher month={month} onChange={changeMonth} />
          <LoadError
            title="Não foi possível carregar o resumo"
            message="Confira sua conexão e tente de novo em instantes."
            onRetry={() => void dashboard.refetch()}
            isRetrying={dashboard.isFetching}
          />
        </div>
      ) : dashboard.data.accountCount + dashboard.data.creditCardCount === 0 ? (
        <FirstSteps />
      ) : (
        <DashboardContent
          data={dashboard.data}
          month={month}
          isStale={dashboard.isPlaceholderData}
          onMonthChange={changeMonth}
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
      <div className="space-y-6">
        <BalanceCards data={data} />
        {/* RN9 da spec 006: as metas ficam junto dos saldos, no que é "hoje" (o mês fica à direita). */}
        <GoalsHomeBlock />
      </div>
      <div className={cn("space-y-3 transition-opacity", isStale && "opacity-60")} aria-busy={isStale}>
        <MonthSwitcher month={month} onChange={onMonthChange} />
        <MonthSummary data={data} />
        <CategorySpending data={data} />
      </div>
    </div>
  );
}
