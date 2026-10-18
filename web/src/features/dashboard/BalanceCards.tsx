import { CreditCard, Landmark } from "lucide-react";

import { formatCurrency, formatSignedCurrency } from "@/lib/utils/currency";

import type { Dashboard } from "./api";

/**
 * RN1 e RN2: o saldo total (sem o cartão) em destaque e a dívida do cartão num bloco separado, para
 * ninguém achar que tem o limite do cartão como dinheiro. Saldo negativo leva o sinal "−" e a cor
 * de despesa (nunca só a cor).
 */
export function BalanceCards({ data }: { data: Dashboard }) {
  const isNegative = data.totalBalanceCents < 0;
  const accounts = data.accountCount === 1 ? "1 conta" : `${data.accountCount} contas`;

  return (
    <div className="grid gap-3">
      <section aria-labelledby="total-balance" className="rounded-2xl bg-primary p-5 text-primary-foreground shadow-sm">
        <h2 id="total-balance" className="flex items-center gap-2 text-sm font-medium opacity-90">
          <Landmark className="size-4" aria-hidden="true" />
          Saldo total
        </h2>
        <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums">
          {isNegative ? formatSignedCurrency(-data.totalBalanceCents, "out") : formatCurrency(data.totalBalanceCents)}
        </p>
        <p className="mt-1 text-sm opacity-90">
          {data.accountCount > 0 ? `Somando ${accounts}, sem o cartão` : "Nenhuma conta além do cartão"}
        </p>
      </section>

      {data.creditCardCount > 0 ? (
        <section aria-labelledby="card-debt" className="rounded-2xl border border-border bg-card p-5">
          <h2 id="card-debt" className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <CreditCard className="size-4" aria-hidden="true" />
            {data.creditCardCount === 1 ? "Dívida do cartão" : "Dívida dos cartões"}
          </h2>
          {data.creditCardDebtCents > 0 ? (
            <p className="mt-2 text-2xl font-semibold tabular-nums text-expense">
              <span className="sr-only">Você deve </span>
              {formatSignedCurrency(data.creditCardDebtCents, "out")}
            </p>
          ) : (
            <p className="mt-2 text-2xl font-semibold">Nenhuma dívida</p>
          )}
        </section>
      ) : null}
    </div>
  );
}
