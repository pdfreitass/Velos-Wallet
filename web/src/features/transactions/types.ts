import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, type LucideIcon } from "lucide-react";

/** RN1 da spec 004. Mesmos valores do enum da API (camelCase). */
export const TRANSACTION_TYPES = ["expense", "income", "transfer"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export type AccountRef = { id: string; name: string };
export type CategoryRef = { id: string; name: string; color: string; icon: string };

/** Uma linha da lista do mês. `category` é null na transferência e no "Sem categoria" (RN6). */
export type TransactionListItem = {
  id: string;
  type: TransactionType;
  /** Sempre positivo: o sinal vem do tipo (RN2). */
  amountCents: number;
  /** "yyyy-MM-dd" — ler com parseDbDate, nunca new Date(). */
  date: string;
  description: string | null;
  account: AccountRef;
  transferAccount: AccountRef | null;
  category: CategoryRef | null;
};

/** Os totais são do mês inteiro, mesmo com o filtro (RN7; somados no banco). */
export type TransactionMonth = {
  month: string;
  incomeCents: number;
  expenseCents: number;
  items: TransactionListItem[];
};

export type TransactionDetail = {
  id: string;
  type: TransactionType;
  amountCents: number;
  date: string;
  description: string | null;
  accountId: string;
  transferAccountId: string | null;
  categoryId: string | null;
};

type TransactionTypeInfo = {
  label: string;
  lower: string;
  Icon: LucideIcon;
};

export const TRANSACTION_TYPE_INFO: Record<TransactionType, TransactionTypeInfo> = {
  expense: { label: "Despesa", lower: "despesa", Icon: ArrowUpRight },
  income: { label: "Receita", lower: "receita", Icon: ArrowDownLeft },
  transfer: { label: "Transferência", lower: "transferência", Icon: ArrowLeftRight },
};

/** "?mes=2026-10&categoria=<id>": o mês e o filtro ficam no endereço (CA7, CA8). */
export const MONTH_PARAM = "mes";
export const CATEGORY_PARAM = "categoria";
