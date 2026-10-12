import { createBrowserRouter } from "react-router";

import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { GuestOnly, RequireAuth, RootRedirect } from "@/features/auth/guards";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { PanelPage } from "@/pages/PanelPage";
import { SignInPage } from "@/pages/SignInPage";
import { SignUpPage } from "@/pages/SignUpPage";

/**
 * Rotas em português (P1 da spec 001). PRIVADO POR PADRÃO: tudo o que não está na lista
 * pública cai em RequireAuth, inclusive endereço desconhecido (que vira 404 só depois do login).
 */
export const router = createBrowserRouter([
  { path: "/", element: <RootRedirect /> },
  {
    element: <GuestOnly />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: "/entrar", element: <SignInPage /> },
          { path: "/cadastro", element: <SignUpPage /> },
        ],
      },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      { path: "/painel", element: <PanelPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
