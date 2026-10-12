/**
 * Mapa de rotas da autenticacao (spec 001, RN8 · ADR 0014).
 *
 * O app e PRIVADO POR PADRAO: o middleware so deixa passar sem sessao as
 * rotas listadas em PUBLIC_PREFIXES. Uma pagina nova ja nasce protegida.
 */

export const ROUTES = {
  signIn: "/entrar",
  signUp: "/cadastro",
  verifyEmail: "/cadastro/verifique-email",
  forgotPassword: "/recuperar-senha",
  resetPassword: "/redefinir-senha",
  authError: "/auth/erro",
  /** Destino depois de entrar, e o fallback de todo redirecionamento. */
  home: "/painel",
} as const;

/** Abertas a todos, com ou sem sessao. */
const PUBLIC_PREFIXES = [
  ROUTES.signIn,
  ROUTES.signUp,
  ROUTES.forgotPassword,
  "/auth",
] as const;

/** So para quem NAO esta logado: com sessao, vao para ROUTES.home. */
const GUEST_ONLY_PREFIXES = [ROUTES.signIn, ROUTES.signUp] as const;

/** "/cadastro" casa com "/cadastro" e "/cadastro/x", mas nao com "/cadastros". */
function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

export function isGuestOnlyRoute(pathname: string): boolean {
  return GUEST_ONLY_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}
