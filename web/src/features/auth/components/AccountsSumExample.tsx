import type { CSSProperties } from "react";
import { CreditCard, Landmark, PiggyBank, Wallet, type LucideIcon } from "lucide-react";

import { formatCurrency, formatSignedCurrency } from "@/lib/utils/currency";

type ExampleAccount = { name: string; icon: LucideIcon; cents: number };

// Dados ILUSTRATIVOS (rotulados na tela): o mecanismo do produto, não números de alguém.
const accounts: ExampleAccount[] = [
  { name: "Conta corrente", icon: Landmark, cents: 235_000 },
  { name: "Poupança", icon: PiggyBank, cents: 812_045 },
  { name: "Dinheiro", icon: Wallet, cents: 18_000 },
];
/** 235.000 + 812.045 + 18.000. No app de verdade a soma vem pronta do banco (view account_balances). */
const exampleTotalCents = 1_065_045;
/** O cartão fica fora do saldo total e aparece como dívida (ADR 0007). */
const exampleCardDebtCents = 64_090;

/** Assinatura das telas de entrada: as contas "se somam" num saldo só (ver globals.css). */
export function AccountsSumExample() {
  return (
    <figure className="space-y-4" aria-labelledby="sum-example-title">
      <h2 id="sum-example-title" className="text-sm font-medium text-muted-foreground">
        Tudo num lugar só
      </h2>

      <ul className="space-y-3">
        {accounts.map((account, index) => (
          <li
            key={account.name}
            className="sum-row flex items-center gap-3"
            style={{ "--sum-index": index } as CSSProperties}
          >
            <account.icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="flex-1">{account.name}</span>
            <span className="font-medium tabular-nums">{formatCurrency(account.cents)}</span>
          </li>
        ))}
      </ul>

      <div className="sum-rule h-px bg-foreground/20" aria-hidden="true" />

      <div className="sum-total space-y-3">
        <p className="flex items-baseline justify-between gap-3">
          <span className="font-semibold">Saldo total</span>
          <span className="text-2xl font-semibold tracking-tight tabular-nums">
            {formatCurrency(exampleTotalCents)}
          </span>
        </p>
        <p className="flex items-center gap-3 text-sm">
          <CreditCard className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="flex-1 text-muted-foreground">Cartão de crédito, fora do saldo</span>
          <span className="font-medium text-expense tabular-nums">
            {formatSignedCurrency(exampleCardDebtCents, "out")}
          </span>
        </p>
      </div>

      <figcaption className="text-xs text-muted-foreground">Exemplo ilustrativo</figcaption>
    </figure>
  );
}
