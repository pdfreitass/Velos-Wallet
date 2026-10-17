import { ApiError } from "@/lib/api/client";

// A tradução geral dos erros (toErrorAlert) mora em @/lib/api/errors; aqui ficam só os
// detalhes do bloqueio de tentativas, que são exclusivos do login.

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
