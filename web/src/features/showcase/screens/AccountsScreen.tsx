import type { CSSProperties } from "react";
import { cn } from "cn";

import {
  assetAccounts,
  cardAccount,
  type AccountId,
  type ExampleAccount,
} from "@/features/showcase/showcase-data";
import { formatCurrency, formatSignedCurrency } from "@/lib/utils/currency";

type AccountsScreenProps = {
  /** Conta destacada (cartão da página com o mouse em cima, ou a seção que fala dela). */
  highlight?: AccountId | null;
  /** Primeira exibição: as contas "se somam" uma a uma (assinatura, ver .sum-row). */
  intro?: boolean;
};

/** Contas e saldo: as contas que somam no saldo e o cartão à parte, como dívida (ADR 0007). */
export function AccountsScreen({ highlight = null, intro = false }: AccountsScreenProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="px-2 text-xs font-medium text-muted-foreground">Somam no saldo</p>
        <ul className="mt-1.5 space-y-1" aria-label="Contas que somam no saldo">
          {assetAccounts.map((account, index) => (
            <AccountRow
              key={account.id}
              account={account}
              index={index}
              intro={intro}
              active={highlight === account.id}
            />
          ))}
        </ul>
      </div>

      <div>
        <p className="px-2 text-xs font-medium text-muted-foreground">Fora do saldo</p>
        <ul className="mt-1.5" aria-label="Fora do saldo">
          <AccountRow
            account={cardAccount}
            index={assetAccounts.length}
            intro={intro}
            active={highlight === cardAccount.id}
            debt
          />
        </ul>
      </div>
    </div>
  );
}

type AccountRowProps = {
  account: ExampleAccount;
  index: number;
  intro: boolean;
  active: boolean;
  debt?: boolean;
};

function AccountRow({ account, index, intro, active, debt = false }: AccountRowProps) {
  return (
    <li
      data-wire-target={account.id}
      data-active={active ? "" : undefined}
      className={cn("account-row flex items-center gap-2.5 rounded-lg px-2 py-2", intro && "sum-row")}
      style={{ "--sum-index": index } as CSSProperties}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted">
        <account.icon className="size-4.5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{account.name}</span>
        <span className="block truncate text-xs text-muted-foreground">{account.kind}</span>
      </span>
      <span className={cn("text-sm font-semibold tabular-nums", debt && "text-expense")}>
        {debt ? formatSignedCurrency(account.cents, "out") : formatCurrency(account.cents)}
      </span>
    </li>
  );
}
