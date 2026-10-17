import { Banknote, CreditCard, Landmark, PiggyBank, type LucideIcon } from "lucide-react";

/** RN1 da spec 002. Mesmos valores do enum da API (camelCase). */
export const ACCOUNT_TYPES = ["checking", "savings", "cash", "creditCard"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  /** Com sinal: negativo é cheque especial ou dívida do cartão (RN3). */
  initialBalanceCents: number;
  /** Saldo atual, somado no SQL (view account_balances). */
  balanceCents: number;
};

export type AccountDeletionImpact = {
  incomeCount: number;
  expenseCount: number;
  transferCount: number;
  affectedAccounts: { id: string; name: string }[];
};

/** Quantas movimentações somem junto com a conta (RN6). */
export function movementCount({ incomeCount, expenseCount, transferCount }: AccountDeletionImpact): number {
  return incomeCount + expenseCount + transferCount;
}

type AccountTypeInfo = {
  label: string;
  Icon: LucideIcon;
  /** Pergunta do campo de valor (RN3). */
  amountLabel: string;
};

export const ACCOUNT_TYPE_INFO: Record<AccountType, AccountTypeInfo> = {
  checking: { label: "Conta corrente", Icon: Landmark, amountLabel: "Quanto tem nesta conta hoje?" },
  savings: { label: "Poupança", Icon: PiggyBank, amountLabel: "Quanto tem nesta conta hoje?" },
  cash: { label: "Dinheiro", Icon: Banknote, amountLabel: "Quanto tem nesta conta hoje?" },
  creditCard: { label: "Cartão de crédito", Icon: CreditCard, amountLabel: "Quanto você deve hoje neste cartão?" },
};

/**
 * RN3: o valor é digitado sempre positivo; o sinal vem do tipo (cartão = dívida) ou da opção
 * "Estou no negativo (cheque especial)", que só existe na conta corrente.
 */
export function toSignedCents(type: AccountType, amountCents: number, overdraft: boolean): number {
  if (amountCents === 0) return 0;
  if (type === "creditCard" || (type === "checking" && overdraft)) return -amountCents;
  return amountCents;
}

/** O caminho de volta, para preencher o formulário de edição. */
export function fromSignedCents(type: AccountType, signedCents: number) {
  return { amountCents: Math.abs(signedCents), overdraft: type === "checking" && signedCents < 0 };
}
