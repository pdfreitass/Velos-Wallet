import { z } from "zod";

import { ACCOUNT_TYPES } from "@/features/accounts/types";
import { MAX_MONEY_CENTS } from "@/lib/utils/currency";

/** RN2: o mesmo limite do AccountRules.NameMaxLength da API. */
export const ACCOUNT_NAME_MAX_LENGTH = 40;

/**
 * Formulário de conta (spec 002, RN1–RN3). Só experiência do usuário: quem decide é a API, com
 * as MESMAS mensagens (api/src/Velos.Application/Accounts/AccountInput.cs).
 * O valor é sempre positivo aqui; o sinal é aplicado no envio (toSignedCents).
 */
export const accountFormSchema = z.object({
  type: z.enum(ACCOUNT_TYPES, { error: "Escolha o tipo da conta" }),
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome da conta")
    .max(ACCOUNT_NAME_MAX_LENGTH, `O nome pode ter no máximo ${ACCOUNT_NAME_MAX_LENGTH} caracteres`),
  amountCents: z.number().int().min(0).max(MAX_MONEY_CENTS, "O valor máximo é R$ 999.999.999,99"),
  overdraft: z.boolean(),
});

export type AccountFormInput = z.input<typeof accountFormSchema>;
export type AccountFormValues = z.output<typeof accountFormSchema>;
