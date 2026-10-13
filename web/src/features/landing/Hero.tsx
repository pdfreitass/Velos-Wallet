import type { Ref, RefObject } from "react";
import { Link } from "react-router";
import { cn } from "cn";

import { buttonVariants } from "@/components/ui/button";
import { AccountCards } from "@/features/landing/AccountCards";
import type { AccountId } from "@/features/showcase/showcase-data";
import { ROUTES } from "@/lib/auth/routes";

type HeroProps = {
  ref: Ref<HTMLElement>;
  cardRefs: RefObject<Map<AccountId, HTMLElement>>;
  activeId: AccountId | null;
  onCardHover: (id: AccountId | null) => void;
  onCardSelect: (id: AccountId) => void;
};

/**
 * Primeira dobra (composição "Tudo converge"): a frase e as ações no alto, as contas espalhadas
 * embaixo. O iPhone para onde os fios convergem fica na coluna ao lado (Story).
 */
export function Hero({ ref, cardRefs, activeId, onCardHover, onCardSelect }: HeroProps) {
  return (
    <section
      ref={ref}
      data-section="hero"
      aria-labelledby="hero-title"
      className="flex flex-col pt-10 pb-12 sm:pt-14 lg:min-h-[max(40rem,calc(100svh-4.5rem))] lg:pt-[clamp(2.5rem,7svh,4.5rem)] lg:pb-12"
    >
      <div className="relative z-10 max-w-[46rem]">
        <h1
          id="hero-title"
          className="text-[clamp(2.5rem,min(5.2vw,8.2svh),4.5rem)] leading-[1.02] font-semibold tracking-[-0.035em] text-balance"
        >
          Seu dinheiro na direção certa.
        </h1>
        <p className="mt-5 max-w-[34rem] text-lg text-pretty text-muted-foreground sm:text-xl">
          Banco, poupança, dinheiro vivo e cartão: tudo chega num lugar só e vira um saldo que você entende.
        </p>
        <div id="hero-actions" className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to={ROUTES.signUp} className={cn(buttonVariants(), "h-13 px-7 text-base")}>
            Criar conta grátis
          </Link>
          <Link to={ROUTES.signIn} className={cn(buttonVariants({ variant: "outline" }), "h-13 border-input px-7 text-base")}>
            Entrar
          </Link>
        </div>
      </div>

      <AccountCards
        cardRefs={cardRefs}
        activeId={activeId}
        onHover={onCardHover}
        onSelect={onCardSelect}
        className="mt-12 lg:mt-auto lg:pt-12"
      />
    </section>
  );
}
