import { ArrowDownLeft, ArrowUpRight, Plus, ReceiptText } from "lucide-react";
import { Link } from "react-router";
import { cn } from "cn";

import { LoadError } from "@/components/shared/LoadError";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/auth/routes";
import { formatSignedCurrency } from "@/lib/utils/currency";
import { formatDayHeading, formatMonthName, todayInSaoPaulo } from "@/lib/utils/date";

import { useTransactionMonth } from "./api";
import { TransactionRow } from "./TransactionRow";
import type { TransactionListItem, TransactionMonth } from "./types";

type TransactionListProps = { month: string; categoryId: string | null };

/** Lista do mês (CA7, CA8) com os 4 estados: carregando, erro, vazio e as transações por dia. */
export function TransactionList({ month, categoryId }: TransactionListProps) {
  const query = useTransactionMonth(month, categoryId);

  if (query.isPending) return <TransactionListSkeleton />;
  if (query.isError) {
    return (
      <LoadError
        title="Não foi possível carregar as transações"
        message="Confira sua conexão e tente de novo em instantes."
        onRetry={() => void query.refetch()}
        isRetrying={query.isFetching}
      />
    );
  }

  const data = query.data;
  return (
    <div className={cn("space-y-6 transition-opacity", query.isPlaceholderData && "opacity-60")} aria-busy={query.isPlaceholderData}>
      <MonthTotals data={data} />
      {data.items.length === 0 ? (
        <EmptyMonth month={month} filtered={categoryId !== null} />
      ) : (
        <DayGroups items={data.items} />
      )}
    </div>
  );
}

/** RN7: só receitas e despesas; transferência fica fora. Sinal + ícone + cor (nunca só a cor). */
function MonthTotals({ data }: { data: TransactionMonth }) {
  return (
    <dl className="grid grid-cols-2 gap-3">
      <div className="rounded-xl border border-border bg-card p-4">
        <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <ArrowDownLeft className="size-4 text-income" aria-hidden="true" />
          Receitas
        </dt>
        <dd className="mt-1 text-lg font-semibold tabular-nums text-income">
          {formatSignedCurrency(data.incomeCents, "in")}
        </dd>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <ArrowUpRight className="size-4 text-expense" aria-hidden="true" />
          Despesas
        </dt>
        <dd className="mt-1 text-lg font-semibold tabular-nums text-expense">
          {formatSignedCurrency(data.expenseCents, "out")}
        </dd>
      </div>
    </dl>
  );
}

function DayGroups({ items }: { items: TransactionListItem[] }) {
  const today = todayInSaoPaulo();
  const days = groupByDay(items);

  return (
    <div className="space-y-5">
      {days.map(([date, dayItems]) => (
        <section key={date} aria-labelledby={`day-${date}`}>
          <h3 id={`day-${date}`} className="mb-2 px-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {formatDayHeading(date, today)}
          </h3>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {dayItems.map((item) => (
              <li key={item.id}>
                <TransactionRow item={item} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** A API já manda ordenado por data desc: basta juntar os vizinhos do mesmo dia. */
function groupByDay(items: TransactionListItem[]): [string, TransactionListItem[]][] {
  return items.reduce<[string, TransactionListItem[]][]>((groups, item) => {
    const last = groups.at(-1);
    if (last && last[0] === item.date) {
      return [...groups.slice(0, -1), [last[0], [...last[1], item]]];
    }
    return [...groups, [item.date, [item]]];
  }, []);
}

function EmptyMonth({ month, filtered }: { month: string; filtered: boolean }) {
  const monthName = formatMonthName(month).split(" de ")[0];
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <ReceiptText className="size-6" aria-hidden="true" />
      </span>
      <h3 className="text-lg font-semibold">
        {filtered ? `Nenhuma transação desta categoria em ${monthName}` : `Nenhuma transação em ${monthName}`}
      </h3>
      <p className="max-w-sm text-muted-foreground">
        {filtered ? "Troque o filtro ou o mês para ver outras transações." : "Lance o que entrou e o que saiu para acompanhar o mês."}
      </p>
      <Link to={ROUTES.newTransaction} className={cn(buttonVariants(), "mt-1 h-11 px-5 text-base")}>
        <Plus aria-hidden="true" />
        Nova transação
      </Link>
    </div>
  );
}

function TransactionListSkeleton() {
  return (
    <div aria-busy="true" className="space-y-6">
      <span role="status" className="sr-only">
        Carregando as transações…
      </span>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex min-h-16 items-center gap-3 px-4 py-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
