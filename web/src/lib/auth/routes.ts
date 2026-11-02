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
  newCategory: "/categorias/nova",
  transactions: "/transacoes",
  newTransaction: "/transacoes/nova",
  goals: "/metas",
  newGoal: "/metas/nova",
} as const;

export const accountPath = (id: string) => `${ROUTES.accounts}/${id}`;
export const categoryPath = (id: string) => `${ROUTES.categories}/${id}`;
export const transactionPath = (id: string) => `${ROUTES.transactions}/${id}`;
export const goalPath = (id: string) => `${ROUTES.goals}/${id}`;
export const editGoalPath = (id: string) => `${ROUTES.goals}/${id}/editar`;
