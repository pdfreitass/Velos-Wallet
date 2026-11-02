import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import { ApiError } from "@/lib/api/client";

/**
 * Códigos cujo `detail` é texto nosso, em português, montado pela API (AuthErrors, CommonErrors,
 * AccountErrors, CategoryErrors). Qualquer outro código cai na mensagem genérica: nunca mostramos
 * texto cru de framework. Todo code novo da API precisa entrar aqui (LICOES, L26).
 */
const OWN_MESSAGES = new Set([
  // Autenticação (spec 001)
  "invalid_credentials",
  "locked",
  "email_taken",
  "weak_password",
  "email_not_confirmed",
  "confirmation_required",
  "rate_limited",
  "auth_unavailable",
  "lockout_unavailable",
  "session_expired",
  // Recuperação de senha e Google: sem estes, o erro caía no genérico "tente de novo", que nunca
  // resolve um link vencido (achado da T23 da spec 001).
  "reset_link_invalid",
  "reset_not_allowed",
  "google_failed",
  // Comuns e dados (spec 002)
  "database_unavailable",
  "validation_failed",
  "not_found",
  "category_name_taken",
]);

export type ErrorAlert = {
  code: string;
  message: string;
};

/** Mensagem do aviso geral de um formulário ou de uma tela, a partir de qualquer erro. */
export function toErrorAlert(error: unknown): ErrorAlert {
  if (!(error instanceof ApiError)) {
    return { code: "unknown_error", message: "Algo deu errado. Tente de novo em instantes." };
  }

  if (error.code === "network_error") {
    return { code: error.code, message: "Sem conexão com o servidor. Confira sua internet e tente de novo." };
  }

  if (error.code === "csrf_header_missing" || error.code === "bad_request") {
    return { code: error.code, message: "Não foi possível enviar o formulário. Recarregue a página e tente de novo." };
  }

  if (OWN_MESSAGES.has(error.code) && error.message) {
    return { code: error.code, message: error.message };
  }

  return { code: error.code, message: "Algo deu errado. Tente de novo em instantes." };
}

/**
 * Leva os erros por campo da API (`validation_failed`, e também o `category_name_taken`, que
 * vem com o erro em `name`) para os campos do formulário.
 * Devolve true se aplicou algum (aí o formulário não mostra o aviso geral).
 */
export function applyServerFieldErrors<T extends FieldValues>(
  error: unknown,
  fields: readonly Path<T>[],
  setError: UseFormSetError<T>,
): boolean {
  if (!(error instanceof ApiError)) return false;

  let applied = false;
  for (const field of fields) {
    const message = error.fieldErrors[field]?.[0];
    if (message) {
      setError(field, { type: "server", message }, { shouldFocus: !applied });
      applied = true;
    }
  }
  return applied;
}
