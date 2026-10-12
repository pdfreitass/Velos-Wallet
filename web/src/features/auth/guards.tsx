import { Navigate, Outlet, useLocation, useSearchParams } from "react-router";

import { FullPageError, FullPageLoader } from "@/components/shared/FullPageState";
import { useCurrentUser } from "@/features/auth/api";
import { isUnauthenticated } from "@/lib/api/client";
import { ROUTES } from "@/lib/auth/routes";
import { getSafeRedirect } from "@/lib/utils/redirect";

/**
 * Rotas privadas (RN8). É experiência do usuário: quem protege os dados é a API (FallbackPolicy).
 * Sem sessão, leva a /entrar guardando o destino (H7).
 */
export function RequireAuth() {
  const location = useLocation();
  const me = useCurrentUser();

  if (me.isPending) return <FullPageLoader />;

  if (me.isError) {
    if (isUnauthenticated(me.error)) {
      const next = `${location.pathname}${location.search}${location.hash}`;
      return <Navigate to={`${ROUTES.signIn}?next=${encodeURIComponent(next)}`} replace />;
    }
    return <FullPageError onRetry={() => void me.refetch()} />;
  }

  return <Outlet />;
}

/** /entrar e /cadastro: quem já está logado vai direto para o destino (CA10). */
export function GuestOnly() {
  const [params] = useSearchParams();
  const me = useCurrentUser();

  if (me.isSuccess) return <Navigate to={getSafeRedirect(params.get("next"))} replace />;
  return <Outlet />;
}

/** "/" não tem conteúdo próprio: painel com sessão, entrada sem (RN8). */
export function RootRedirect() {
  const me = useCurrentUser();

  if (me.isPending) return <FullPageLoader />;
  return <Navigate to={me.isSuccess ? ROUTES.home : ROUTES.signIn} replace />;
}
