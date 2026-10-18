import { ArrowLeftRight, CircleHelp } from "lucide-react";
import { Link } from "react-router";
import { cn } from "cn";

import { CategoryIcon } from "@/components/shared/CategoryBadge";
import { transactionPath } from "@/lib/auth/routes";
import { formatCurrency, formatSignedCurrency } from "@/lib/utils/currency";

import type { TransactionListItem } from "./types";

/**
 * Uma transação na lista: ícone da categoria (ou de transferência / "Sem categoria"), descrição ou
 * nome da categoria, conta, e o valor com sinal + cor (nunca só a cor, CA-a11y). A transferência
 * não tem sinal: não é gasto nem ganho (RN7).
 */
export function TransactionRow({ item }: { item: TransactionListItem }) {
  const { title, subtitle } = describe(item);

  return (
    <Link
      to={transactionPath(item.id)}
      className="flex min-h-16 items-center gap-3 px-4 py-3 text-card-foreground outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
    >
      <RowIcon item={item} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{title}</span>
        <span className="block truncate text-sm text-muted-foreground">{subtitle}</span>
      </span>
      <Amount item={item} />
    </Link>
  );
}

function describe(item: TransactionListItem): { title: string; subtitle: string } {
  if (item.type === "transfer") {
    return {
      title: item.description ?? "Transferência",
      subtitle: `${item.account.name} → ${item.transferAccount?.name ?? ""}`,
    };
  }

  const categoryName = item.category?.name ?? "Sem categoria";
  return {
    title: item.description ?? categoryName,
    subtitle: item.description ? `${categoryName} · ${item.account.name}` : item.account.name,
  };
}

function RowIcon({ item }: { item: TransactionListItem }) {
  if (item.category) return <CategoryIcon color={item.category.color} icon={item.category.icon} />;

  const Icon = item.type === "transfer" ? ArrowLeftRight : CircleHelp;
  return (
    <span
      aria-hidden="true"
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
    >
      <Icon className="size-5" />
    </span>
  );
}

function Amount({ item }: { item: TransactionListItem }) {
  if (item.type === "transfer") {
    return <span className="shrink-0 font-semibold tabular-nums">{formatCurrency(item.amountCents)}</span>;
  }

  const isIncome = item.type === "income";
  return (
    <span className={cn("shrink-0 font-semibold tabular-nums", isIncome ? "text-income" : "text-expense")}>
      <span className="sr-only">{isIncome ? "Receita de " : "Despesa de "}</span>
      {formatSignedCurrency(item.amountCents, isIncome ? "in" : "out")}
    </span>
  );
}
