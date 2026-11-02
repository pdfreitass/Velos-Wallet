import { Link, Outlet } from "react-router";

import { VelosMark } from "@/components/brand/VelosMark";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { ROUTES } from "@/lib/auth/routes";

import { BottomNav, SideNavLinks } from "./AppNav";
import { SignOutButton } from "./SignOutButton";

const MAIN_ID = "conteudo";

/**
 * Casca das rotas logadas (spec 002, T10). Celular: cabeçalho no topo e barra de navegação no
 * rodapé; o <main> reserva espaço embaixo para a barra não cobrir o último item (CA12).
 * Desktop (lg+): menu lateral fixo de 240 px com marca, navegação, tema e Sair.
 */
export function AppLayout() {
  return (
    <div className="min-h-dvh">
      <a
        href={`#${MAIN_ID}`}
        className="sr-only z-50 rounded-lg bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Pular para o conteúdo
      </a>

      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col gap-6 border-r border-sidebar-border bg-sidebar px-3 py-5 text-sidebar-foreground lg:flex">
        <Brand className="px-3" />
        <SideNavLinks />
        <div className="mt-auto flex flex-col gap-2">
          <ThemeToggle
            ghost
            className="h-11 w-full justify-start gap-3 px-3 text-base font-medium text-muted-foreground hover:text-foreground [&_svg:not([class*='size-'])]:size-5"
          />
          <SignOutButton />
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border bg-background/95 px-4 py-1.5 backdrop-blur lg:hidden">
        <Brand />
        <div className="flex items-center gap-1">
          <ThemeToggle iconOnly ghost />
          <SignOutButton iconOnly />
        </div>
      </header>

      <main
        id={MAIN_ID}
        tabIndex={-1}
        className="px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] outline-none sm:px-6 lg:pt-10 lg:pr-10 lg:pb-10 lg:pl-70"
      >
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}

function Brand({ className }: { className?: string }) {
  return (
    <Link
      to={ROUTES.home}
      className={`flex min-h-11 items-center gap-2 rounded-lg font-semibold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${className ?? ""}`}
    >
      <VelosMark className="h-7 w-auto" />
      Velos Wallet
    </Link>
  );
}
