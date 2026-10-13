import { useEffect, useState } from "react";
import { Link } from "react-router";
import { cn } from "cn";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/auth/routes";

/**
 * Celular (RN3): depois que os botões da primeira dobra saem da tela, "Criar conta" fica preso no
 * rodapé, a um toque. Some de novo quando a chamada final aparece, para não repetir os botões.
 * Escondida, a barra fica `inert` (fora do Tab e do leitor de tela).
 */
export function MobileCtaBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const heroActions = document.getElementById("hero-actions");
    const close = document.getElementById("comecar");
    if (!heroActions || !close) return;

    let pastHero = false;
    let reachedClose = false;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const above = entry.boundingClientRect.top < 0;
        if (entry.target === heroActions) pastHero = !entry.isIntersecting && above;
        else reachedClose = entry.isIntersecting || above;
      }
      setVisible(pastHero && !reachedClose);
    });
    observer.observe(heroActions);
    observer.observe(close);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      data-visible={visible}
      inert={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        "shadow-[0_-10px_30px_-18px_rgb(4_20_15/0.35)] motion-safe:transition-transform motion-safe:duration-300",
        "data-[visible=false]:translate-y-full lg:hidden",
      )}
    >
      <Link to={ROUTES.signUp} className={cn(buttonVariants(), "h-12 w-full text-base")}>
        Criar conta grátis
      </Link>
    </div>
  );
}
