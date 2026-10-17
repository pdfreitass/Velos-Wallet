import { ChevronRight, Plus, Wallet } from "lucide-react";
import { Link } from "react-router";
import { cn } from "cn";

import { LoadError } from "@/components/shared/LoadError";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/auth/routes";
import { formatCurrency } from "@/lib/utils/currency";

import { useAccounts } from "./api";
import { ACCOUNT_TYPE_INFO, type Account } from "./types";

/** Lista de /contas (spec 002): contas e cartões em seções separadas (RN5), com os 4 estados. */
export function AccountList() {
  const accounts = useAccounts();

  if (accounts.isPending) return <AccountListSkeleton />;
  if (accounts.isError) {
    return (
      <LoadError
        title="Não foi possível carregar suas contas"
        message="Confira sua conexão e tente de novo em instantes."
        onRetry={() => void accounts.refetch()}
        isRetrying={accounts.isFetching}
      />
    );
  }
  if (accounts.data.length === 0) return <EmptyAccounts />;

  const cards = accounts.data.filter((a) => a.type === "creditCard");
  const others = accounts.data.filter((a) => a.type !== "creditCard");

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      {others.length > 0 ? <AccountSection title="Contas" accounts={others} /> : null}
      {cards.length > 0 ? <AccountSection title="Cartões de crédito" accounts={cards} /> : null}
    </div>
  );
}

function AccountSection({ title, accounts }: { title: string; accounts: Account[] }) {
  const headingId = `section-${title.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="mb-2 px-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {title}
      </h2>
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {accounts.map((account) => (
          <li key={account.id}>
            <AccountRow account={account} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function AccountRow({ account }: { account: Account }) {
  const { label, Icon } = ACCOUNT_TYPE_INFO[account.type];
  const isNegative = account.balanceCents < 0;
  const subtitle = account.type === "checking" && isNegative ? `${label} · cheque especial` : label;

  return (
    <Link
      to={`${ROUTES.accounts}/${account.id}`}
      className="flex min-h-16 items-center gap-3 px-4 py-3 text-card-foreground outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{account.name}</span>
        <span className="block text-sm text-muted-foreground">{subtitle}</span>
      </span>
      <span className="text-right">
        <span className={cn("block font-semibold tabular-nums", isNegative && "text-expense")}>
          {formatCurrency(account.balanceCents)}
        </span>
        {account.type === "creditCard" ? <span className="block text-xs text-muted-foreground">Fatura atual</span> : null}
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  );
}

function EmptyAccounts() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <Wallet className="size-6" aria-hidden="true" />
      </span>
      <h2 className="text-lg font-semibold">Você ainda não tem contas</h2>
      <p className="max-w-sm text-muted-foreground">
        Cadastre sua conta corrente, poupança, dinheiro ou cartão com o saldo de hoje.
      </p>
      <Link to={`${ROUTES.accounts}/nova`} className={cn(buttonVariants(), "mt-1 h-11 px-5 text-base")}>
        <Plus aria-hidden="true" />
        Adicionar conta
      </Link>
    </div>
  );
}

function AccountListSkeleton() {
  return (
    <div aria-busy="true" className="space-y-2">
      <span role="status" className="sr-only">
        Carregando suas contas…
      </span>
      <Skeleton className="h-4 w-20" />
      <div className="divide-y divide-border rounded-xl border border-border bg-card">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex min-h-16 items-center gap-3 px-4 py-3">
            <Skeleton className="size-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
