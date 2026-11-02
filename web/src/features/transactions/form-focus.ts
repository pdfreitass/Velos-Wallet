import { ApiError } from "@/lib/api/client";

/** Campos do formulário na ordem da tela (e os que a API pode devolver com erro). */
export const TRANSACTION_FIELDS = [
  "type",
  "amountCents",
  "categoryId",
  "accountId",
  "transferAccountId",
  "date",
  "description",
] as const;

/**
 * Leva o foco ao primeiro campo com erro (do Zod ou da API), na ordem da tela. A categoria é uma
 * grade de botões: o foco vai para o primeiro botão dela. O foco é feito aqui, e não pelo React Hook
 * Form, porque a grade não tem um único ref.
 */
export function focusFirstError(errors: unknown): void {
  const fieldErrors = errors instanceof ApiError ? errors.fieldErrors : (errors as Record<string, unknown>);
  const first = TRANSACTION_FIELDS.find((name) => name in fieldErrors && name !== "type");
  if (!first) return;

  // Espera o React desenhar a mensagem de erro (o fieldset da categoria ganha o aria-describedby).
  requestAnimationFrame(() => {
    const target =
      first === "categoryId"
        ? document.querySelector<HTMLElement>("fieldset[aria-describedby='categoryId-error'] button")
        : document.getElementById(first);
    target?.focus();
  });
}
