import { cn } from "cn";

import { LoadError } from "@/components/shared/LoadError";
import { formatDayHeading, todayInSaoPaulo } from "@/lib/utils/date";

import { useTransactionMonth } from "./api";
import { EmptyMonth, MonthTotals, TransactionListSkeleton } from "./TransactionListStates";
import { TransactionRow } from "./TransactionRow";
import type { TransactionListItem } from "./types";

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

  // Durante a troca de mês ou de filtro, a lista anterior fica na tela, apagada, até a nova chegar.
  // Os textos usam o mês e o filtro DA RESPOSTA, para não mostrar "Nenhuma transação em novembro"
  // sobre os dados de outubro.
  const data = query.data;
  const isStale = query.isPlaceholderData;
  return (
    <div className={cn("space-y-6 transition-opacity", isStale && "opacity-60")} aria-busy={isStale}>
      <MonthTotals data={data} filtered={categoryId !== null} />
      {data.items.length === 0 ? (
        isStale ? null : <EmptyMonth month={data.month} filtered={categoryId !== null} />
      ) : (
        <DayGroups items={data.items} />
      )}
    </div>
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
