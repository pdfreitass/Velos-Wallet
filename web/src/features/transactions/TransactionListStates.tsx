import { ArrowDownLeft, ArrowUpRight, Plus, ReceiptText } from "lucide-react";
import { Link } from "react-router";
import { cn } from "cn";

import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/auth/routes";
import { formatSignedCurrency } from "@/lib/utils/currency";
import { formatMonthName } from "@/lib/utils/date";

import type { TransactionMonth } from "./types";

/**
 * RN7: só receitas e despesas; transferência fica fora. Sinal + ícone + cor (nunca só a cor). Com o
 * filtro ativo os totais continuam do mês inteiro, e o rótulo diz isso.
 */
export function MonthTotals({ data, filtered }: { data: TransactionMonth; filtered: boolean }) {
  const suffix = filtered ? " do mês" : "";
  return (
    <dl className="grid grid-cols-2 gap-3">
      <div className="rounded-xl border border-border bg-card p-4">
        <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <ArrowDownLeft className="size-4 text-income" aria-hidden="true" />
          Receitas{suffix}
        </dt>
        <dd className="mt-1 text-lg font-semibold tabular-nums text-income">
          {formatSignedCurrency(data.incomeCents, "in")}
        </dd>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <ArrowUpRight className="size-4 text-expense" aria-hidden="true" />
          Despesas{suffix}
        </dt>
        <dd className="mt-1 text-lg font-semibold tabular-nums text-expense">
          {formatSignedCurrency(data.expenseCents, "out")}
        </dd>
      </div>
    </dl>
  );
}

export function EmptyMonth({ month, filtered }: { month: string; filtered: boolean }) {
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

export function TransactionListSkeleton() {
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
