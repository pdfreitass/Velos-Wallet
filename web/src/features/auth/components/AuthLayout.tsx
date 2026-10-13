import { Link, Outlet } from "react-router";

import { VelosMark } from "@/components/brand/VelosMark";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { BrandPanel } from "@/features/auth/components/BrandPanel";

/**
 * Layout de /entrar e /cadastro. Desktop: painel da marca + formulário (5/6).
 * Celular: só o formulário, com a marca no topo. Rota de layout: o painel não remonta
 * ao alternar entre entrar e criar conta, então a animação do exemplo roda uma vez.
 */
export function AuthLayout() {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <BrandPanel />

      <div className="flex min-h-dvh flex-col px-4 pt-4 pb-8 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between gap-4 lg:justify-end">
          <Link to="/" className="flex items-center gap-2 rounded-md lg:hidden">
            <VelosMark className="h-7 w-auto" />
            <span className="font-semibold tracking-tight">Velos Wallet</span>
          </Link>
          <ThemeToggle />
        </header>

        {/* Celular: o formulário começa logo abaixo do topo (sem vazio acima). Desktop: centralizado. */}
        <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-start pt-12 lg:justify-center lg:pt-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
