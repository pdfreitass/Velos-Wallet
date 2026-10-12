import { ApiError } from "@/lib/api/client";

/**
 * Códigos cujo `detail` é texto nosso, em português, montado pela API (AuthErrors e CommonErrors).
 * Qualquer outro código cai na mensagem genérica: nunca mostramos texto cru de framework.
 */
const OWN_MESSAGES = new Set([
  "invalid_credentials",
  "locked",
  "email_taken",
  "weak_password",
  "email_not_confirmed",
  "confirmation_required",
  "rate_limited",
  "auth_unavailable",
  "lockout_unavailable",
  "database_unavailable",
]);

export type AuthAlert = {
  code: string;
  message: string;
};

export function toAuthAlert(error: unknown): AuthAlert {
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
