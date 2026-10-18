import { z } from "zod";

import { TRANSACTION_TYPES } from "@/features/transactions/types";
import { MAX_MONEY_CENTS } from "@/lib/utils/currency";
import { todayInSaoPaulo } from "@/lib/utils/date";

/** RN5: o mesmo limite do TransactionRules.DescriptionMaxLength da API. */
export const DESCRIPTION_MAX_LENGTH = 100;

/**
 * Formulário de transação (spec 004, RN1–RN6). Só experiência do usuário: quem decide é a API,
 * com as MESMAS mensagens (api/src/Velos.Application/Transactions/TransactionInput.cs).
 * Os ids vazios ("") são "não escolhido".
 */
export const transactionFormSchema = z
  .object({
    type: z.enum(TRANSACTION_TYPES, { error: "Escolha o tipo da transação" }),
    amountCents: z
      .number()
      .int()
      .min(1, "Informe um valor maior que zero")
      .max(MAX_MONEY_CENTS, "O valor máximo é R$ 999.999.999,99"),
    // "yyyy-MM-dd" comparado como texto: a ordem do texto é a ordem das datas.
    date: z
      .string()
      .min(1, "Informe a data")
      .refine((date) => date <= todayInSaoPaulo(), "A data não pode ser no futuro"),
    description: z
      .string()
      .trim()
      .max(DESCRIPTION_MAX_LENGTH, `A descrição pode ter no máximo ${DESCRIPTION_MAX_LENGTH} caracteres`),
    accountId: z.string().min(1, "Escolha a conta"),
    transferAccountId: z.string(),
    categoryId: z.string(),
  })
  .superRefine((value, ctx) => {
    if (value.type === "transfer") {
      if (!value.transferAccountId) {
        ctx.addIssue({ code: "custom", path: ["transferAccountId"], message: "Escolha a conta de destino" });
      } else if (value.transferAccountId === value.accountId) {
        ctx.addIssue({ code: "custom", path: ["transferAccountId"], message: "Escolha uma conta diferente da de origem" });
      }
      return;
    }

    if (!value.categoryId) {
      ctx.addIssue({
        code: "custom",
        path: ["categoryId"],
        message: value.type === "income" ? "Escolha uma categoria de receita" : "Escolha uma categoria de despesa",
      });
    }
  });

export type TransactionFormInput = z.input<typeof transactionFormSchema>;
export type TransactionFormValues = z.output<typeof transactionFormSchema>;
