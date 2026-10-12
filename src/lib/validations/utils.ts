import { z } from "zod";

/** Primeiro erro de cada campo, no formato que os formularios mostram. */
export type FieldErrors<TField extends string> = Partial<Record<TField, string>>;

export function toFieldErrors<TField extends string>(
  error: z.ZodError,
): FieldErrors<TField> {
  const result: FieldErrors<TField> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in result)) {
      result[field as TField] = issue.message;
    }
  }
  return result;
}
