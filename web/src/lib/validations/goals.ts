import { z } from "zod";

import { MAX_MONEY_CENTS } from "@/lib/utils/currency";
import { todayInSaoPaulo } from "@/lib/utils/date";
import { MIN_TRANSACTION_DATE } from "@/lib/validations/transactions";

/** RN1: o mesmo limite do GoalRules.NameMaxLength da API. */
export const GOAL_NAME_MAX_LENGTH = 60;

/** O mesmo GoalRules.MaxDeadline da API. */
export const MAX_GOAL_DEADLINE = "2100-12-31";

/**
 * Formulário de meta (spec 006, RN1 e RN2). Só experiência do usuário: quem decide é a API, com
 * as MESMAS mensagens (api/src/Velos.Application/Goals/GoalInputs.cs).
 *
 * `deadline` vazio ("") é "sem prazo". A RN2 deixa manter um prazo vencido na edição, então a
 * regra "não pode ser no passado" só vale para uma data DIFERENTE da gravada: quem sabe a data
 * gravada é quem monta o schema (`currentDeadline`).
 */
export function goalFormSchema(currentDeadline: string | null = null) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, "Informe o nome da meta")
      .max(GOAL_NAME_MAX_LENGTH, `O nome pode ter no máximo ${GOAL_NAME_MAX_LENGTH} caracteres`),
    targetCents: z
      .number()
      .int()
      .min(1, "Informe um valor maior que zero")
      .max(MAX_MONEY_CENTS, "O valor máximo é R$ 999.999.999,99"),
    // "yyyy-MM-dd" comparado como texto: a ordem do texto é a ordem das datas.
    deadline: z
      .string()
      .refine((date) => date === "" || date <= MAX_GOAL_DEADLINE, "Informe um prazo até 2100")
      .refine(
        (date) => date === "" || date === currentDeadline || date >= todayInSaoPaulo(),
        "O prazo não pode ser no passado",
      ),
  });
}

export type GoalFormInput = z.input<ReturnType<typeof goalFormSchema>>;
export type GoalFormValues = z.output<ReturnType<typeof goalFormSchema>>;

/** Aporte (RN3): valor maior que zero e data entre 2000 e hoje. */
export const contributionFormSchema = z.object({
  amountCents: z
    .number()
    .int()
    .min(1, "Informe um valor maior que zero")
    .max(MAX_MONEY_CENTS, "O valor máximo é R$ 999.999.999,99"),
  date: z
    .string()
    .min(1, "Informe a data")
    .refine((date) => date >= MIN_TRANSACTION_DATE, "Informe uma data a partir de 2000")
    .refine((date) => date <= todayInSaoPaulo(), "A data não pode ser no futuro"),
});

export type ContributionFormInput = z.input<typeof contributionFormSchema>;
export type ContributionFormValues = z.output<typeof contributionFormSchema>;
