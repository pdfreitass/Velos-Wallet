/**
 * Rotas do front (spec 001, P1: em português; RN8).
 *
 * Quem protege os dados é a API (FallbackPolicy). No front, a lista de rotas públicas é a
 * árvore de web/src/router.tsx: o que não está nela passa pelo RequireAuth.
 */
export const ROUTES = {
  signIn: "/entrar",
  signUp: "/cadastro",
  forgotPassword: "/recuperar-senha",
  resetPassword: "/redefinir-senha",
  authError: "/auth/erro",
  /** Destino depois de entrar e fallback de todo redirecionamento. */
  home: "/painel",
  accounts: "/contas",
  newAccount: "/contas/nova",
  categories: "/categorias",
} as const;

export const accountPath = (id: string) => `${ROUTES.accounts}/${id}`;
