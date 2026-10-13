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

/** Número inteiro que a API manda junto do erro (ex.: attemptsLeft, minutesLeft), se houver. */
function numberDetail(error: unknown, key: string): number | null {
  if (!(error instanceof ApiError)) return null;
  const value = error.details[key];
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;
}

/** Tentativas restantes antes do bloqueio (da 3ª senha errada em diante; spec 001, RN5). */
export function attemptsLeftOf(error: unknown): number | null {
  return error instanceof ApiError && error.code === "invalid_credentials"
    ? numberDetail(error, "attemptsLeft")
    : null;
}

/** Minutos de bloqueio que faltam (código `locked`). */
export function minutesLeftOf(error: unknown): number | null {
  return error instanceof ApiError && error.code === "locked" ? numberDetail(error, "minutesLeft") : null;
}
