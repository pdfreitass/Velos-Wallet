import { ROUTES } from "@/lib/auth/routes";

/** Origem ficticia: so serve para o parser de URL resolver caminhos relativos. */
const INTERNAL_ORIGIN = "http://velos.internal";

/**
 * Devolve `next` apenas se for um caminho INTERNO do app (spec 001, RN7).
 *
 * Sem isto, `/entrar?next=https://site-falso.com` levaria o utilizador, ja
 * autenticado, para fora do app (open redirect: base de phishing).
 *
 * Recusa tudo o que o browser trataria como outro dominio:
 * "https://x.com", "//x.com", "/\x.com", "/\t/x.com" (o parser remove o tab).
 */
export function getSafeRedirect(
  next: string | null | undefined,
  fallback: string = ROUTES.home,
): string {
  if (!next || !next.startsWith("/") || looksExternal(next)) return fallback;

  try {
    const url = new URL(next, INTERNAL_ORIGIN);
    if (url.origin !== INTERNAL_ORIGIN) return fallback;
    // Confere de novo DEPOIS de normalizar: "/..//x.com" passa na checagem acima,
    // mas o parser remove o ".." e sobra "//x.com" (idem "/.//x.com", "/%2e%2e//x.com").
    const resolved = `${url.pathname}${url.search}${url.hash}`;
    return looksExternal(resolved) ? fallback : resolved;
  } catch {
    return fallback;
  }
}

function looksExternal(path: string): boolean {
  return path.startsWith("//") || path.startsWith("/\\");
}
