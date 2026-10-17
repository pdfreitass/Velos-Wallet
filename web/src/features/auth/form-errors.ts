import { ROUTES } from "@/lib/auth/routes";

/** Repassa o destino original entre entrar e criar conta (H7). */
export function withNext(path: string, next: string): string {
  return next === ROUTES.home ? path : `${path}?next=${encodeURIComponent(next)}`;
}
