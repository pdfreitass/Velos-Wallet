import { Link } from "react-router";
import { cn } from "cn";

import { buttonVariants } from "@/components/ui/button";
import { DevicesIllustration } from "@/features/landing/DevicesIllustration";
import { ROUTES } from "@/lib/auth/routes";

/** Fechamento: "Sem loja de apps" e a chamada final com as duas ações (RN3). */
export function CloseSection() {
  return (
    <section
      id="comecar"
      aria-labelledby="close-title"
      className="mx-auto grid max-w-[90rem] items-center gap-14 px-4 py-20 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16 lg:px-20 lg:py-32"
    >
      <div>
        <h2
          id="close-title"
          className="text-[clamp(2.25rem,4.2vw,3.75rem)] leading-[1.02] font-semibold tracking-[-0.035em] text-balance"
        >
          Sem loja de apps.
        </h2>
        <p className="mt-5 max-w-[30rem] text-lg text-pretty text-muted-foreground">
          Abra no navegador do celular ou do computador e comece agora. Nada para baixar, e criar a conta é grátis.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to={ROUTES.signUp} className={cn(buttonVariants(), "h-13 px-7 text-base")}>
            Criar conta grátis
          </Link>
          <Link to={ROUTES.signIn} className={cn(buttonVariants({ variant: "outline" }), "h-13 border-input px-7 text-base")}>
            Entrar
          </Link>
        </div>
      </div>

      <DevicesIllustration className="hidden md:block" />
    </section>
  );
}
