import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import { ApiError } from "@/lib/api/client";
import { ROUTES } from "@/lib/auth/routes";

/**
 * Leva os erros por campo do `validation_failed` da API para os campos do formulário.
 * Devolve true se aplicou algum (aí o formulário não mostra o aviso geral).
 */
export function applyServerFieldErrors<T extends FieldValues>(
  error: unknown,
  fields: readonly Path<T>[],
  setError: UseFormSetError<T>,
): boolean {
  if (!(error instanceof ApiError) || error.code !== "validation_failed") return false;

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

/** Repassa o destino original entre entrar e criar conta (H7). */
export function withNext(path: string, next: string): string {
  return next === ROUTES.home ? path : `${path}?next=${encodeURIComponent(next)}`;
}
