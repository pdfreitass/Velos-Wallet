import type { Account } from "@/features/accounts/types";
import type { Category } from "@/features/categories/types";
import { lastUsed } from "@/lib/utils/last-used";
import { todayInSaoPaulo } from "@/lib/utils/date";
import type { TransactionFormInput, TransactionFormValues } from "@/lib/validations/transactions";

import type { SaveTransactionRequest } from "./api";
import type { TransactionDetail, TransactionType } from "./types";

/** A última categoria usada do tipo, se ainda existir (RN6: sugerida no lançamento). */
export function suggestedCategory(type: TransactionType, categories: Category[]): string {
  if (type === "transfer") return "";
  const remembered = lastUsed.category(type);
  return categories.some((c) => c.id === remembered && c.type === type) ? (remembered ?? "") : "";
}

/**
 * Valores iniciais. Nova: despesa, hoje, a última conta usada (ou a primeira) e a última categoria
 * de despesa. Edição: o que está salvo; "Sem categoria" vem vazio para escolher (CA12).
 */
export function initialValues(
  accounts: Account[],
  categories: Category[],
  transaction?: TransactionDetail,
): TransactionFormInput {
  if (transaction) {
    return {
      type: transaction.type,
      amountCents: transaction.amountCents,
      date: transaction.date,
      description: transaction.description ?? "",
      accountId: transaction.accountId,
      transferAccountId: transaction.transferAccountId ?? "",
      categoryId: transaction.categoryId ?? "",
    };
  }

  const remembered = lastUsed.account();
  const accountId = accounts.some((a) => a.id === remembered) ? (remembered ?? "") : (accounts[0]?.id ?? "");
  return {
    type: "expense",
    amountCents: 0,
    date: todayInSaoPaulo(),
    description: "",
    accountId,
    transferAccountId: "",
    categoryId: suggestedCategory("expense", categories),
  };
}

/** O corpo da API: categoria só em despesa e receita, destino só na transferência (RN1). */
export function toRequest(values: TransactionFormValues): SaveTransactionRequest {
  const isTransfer = values.type === "transfer";
  return {
    type: values.type,
    amountCents: values.amountCents,
    date: values.date,
    description: values.description || null,
    accountId: values.accountId,
    transferAccountId: isTransfer ? values.transferAccountId : null,
    categoryId: isTransfer ? null : values.categoryId,
  };
}
