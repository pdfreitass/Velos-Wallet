import { useEffect, useState } from "react";
import { Link } from "react-router";
import { cn } from "cn";

import { VelosMark } from "@/components/brand/VelosMark";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/auth/routes";

/**
 * Cabeçalho fixo da página inicial: marca, tema, Entrar e Criar conta. Altura de 4.5rem no
 * desktop (o iPhone fixo das seções se posiciona abaixo dela). No celular, "Criar conta" fica na
 * primeira dobra e depois na barra do rodapé (MobileCtaBar).
 */
export function LandingHeader() {
  const [scrolled, setScrolled] = useState(() => window.scrollY > 8);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-scrolled={scrolled}
      className="sticky top-0 z-40 border-b border-transparent bg-background transition-colors data-[scrolled=true]:border-border"
    >
      <div className="mx-auto flex h-16 max-w-[90rem] items-center justify-between gap-3 px-4 sm:px-8 lg:h-18 lg:px-20">
        <Link to="/" className="flex items-center gap-2.5 rounded-md focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none">
          <VelosMark className="h-8 w-auto" />
          <span className="text-lg font-semibold tracking-tight">Velos Wallet</span>
        </Link>

        <nav aria-label="Acesso" className="flex items-center gap-2">
          <ThemeToggle iconOnly />
          <Link to={ROUTES.signIn} className={cn(buttonVariants({ variant: "outline" }), "h-10 border-input px-4 text-sm")}>
            Entrar
          </Link>
          <Link to={ROUTES.signUp} className={cn(buttonVariants(), "hidden h-10 px-4 text-sm sm:inline-flex")}>
            Criar conta
          </Link>
        </nav>
      </div>
    </header>
  );
}
