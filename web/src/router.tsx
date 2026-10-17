import { createBrowserRouter } from "react-router";

import { FullPageLoader } from "@/components/shared/FullPageState";
import { GuestOnly, RequireAuth } from "@/features/auth/guards";
import { LandingPage } from "@/pages/LandingPage";

/**
 * Rotas em português (P1 da spec 001). PRIVADO POR PADRÃO: tudo o que não está na lista
 * pública cai em RequireAuth, inclusive endereço desconhecido (que vira 404 só depois do login).
 *
 * A página inicial carrega junto com o app (é a porta de entrada); as outras telas carregam
 * SOB DEMANDA (spec 003, T1): quem abre "/" não baixa o código dos formulários (Zod, React
 * Hook Form) nem o do painel.
 */
export const router = createBrowserRouter([
  {
    hydrateFallbackElement: <FullPageLoader />,
    children: [
      {
        // Públicas. Quem já está logado vai para o painel (spec 003, RN1; spec 001, CA10).
        element: <GuestOnly />,
        children: [
          { path: "/", element: <LandingPage /> },
          {
            lazy: () => import("@/features/auth/components/AuthLayout").then((m) => ({ Component: m.AuthLayout })),
            children: [
              { path: "/entrar", lazy: () => import("@/pages/SignInPage").then((m) => ({ Component: m.SignInPage })) },
              { path: "/cadastro", lazy: () => import("@/pages/SignUpPage").then((m) => ({ Component: m.SignUpPage })) },
              {
                path: "/recuperar-senha",
                lazy: () => import("@/pages/ForgotPasswordPage").then((m) => ({ Component: m.ForgotPasswordPage })),
              },
              {
                // Para onde a API manda (302) quando o Google falha ou é cancelado.
                path: "/auth/erro",
                lazy: () => import("@/pages/AuthErrorPage").then((m) => ({ Component: m.AuthErrorPage })),
              },
            ],
          },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            // Privada: a volta do link de email (/auth/confirm) já deixou a sessão criada. Quem abre
            // esta rota direto, sem link, cai no login — e sem o cookie de recuperação a API recusa.
            lazy: () => import("@/features/auth/components/AuthLayout").then((m) => ({ Component: m.AuthLayout })),
            children: [
              {
                path: "/redefinir-senha",
                lazy: () => import("@/pages/ResetPasswordPage").then((m) => ({ Component: m.ResetPasswordPage })),
              },
            ],
          },
          {
            // Casca do app logado (spec 002, T10): navegação, tema e Sair. O "não encontrado" fica
            // dentro dela para o menu continuar à mão (e Contas/Categorias caem aqui até a T11/T12).
            lazy: () => import("@/features/app-shell/AppLayout").then((m) => ({ Component: m.AppLayout })),
            children: [
              { path: "/painel", lazy: () => import("@/pages/PanelPage").then((m) => ({ Component: m.PanelPage })) },
              { path: "/contas", lazy: () => import("@/pages/AccountsPage").then((m) => ({ Component: m.AccountsPage })) },
              {
                path: "/contas/nova",
                lazy: () => import("@/pages/AccountFormPage").then((m) => ({ Component: m.NewAccountPage })),
              },
              {
                path: "/contas/:id",
                lazy: () => import("@/pages/AccountFormPage").then((m) => ({ Component: m.EditAccountPage })),
              },
              {
                path: "/categorias",
                lazy: () => import("@/pages/CategoriesPage").then((m) => ({ Component: m.CategoriesPage })),
              },
              {
                path: "/categorias/nova",
                lazy: () => import("@/pages/CategoryFormPage").then((m) => ({ Component: m.NewCategoryPage })),
              },
              {
                path: "/categorias/:id",
                lazy: () => import("@/pages/CategoryFormPage").then((m) => ({ Component: m.EditCategoryPage })),
              },
              { path: "*", lazy: () => import("@/pages/NotFoundPage").then((m) => ({ Component: m.NotFoundPage })) },
            ],
          },
        ],
      },
    ],
  },
]);
