import { ChevronRight, Plus, Tags } from "lucide-react";
import { Link } from "react-router";
import { cn } from "cn";

import { buttonVariants } from "@/components/ui/button";
import { AccountList } from "@/features/accounts/AccountList";
import { ROUTES } from "@/lib/auth/routes";

/** /contas (spec 002, T11). */
export function AccountsPage() {
  return (
    <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-5xl">
      <title>Contas · Velos Wallet</title>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Contas</h1>
        <Link to={ROUTES.newAccount} className={cn(buttonVariants(), "h-11 px-4 text-base")}>
          <Plus aria-hidden="true" />
          Adicionar
          <span className="sr-only"> conta</span>
        </Link>
      </div>
      <AccountList />

      {/*
        P1 da spec 006: Categorias saiu da barra do celular para dar lugar a Metas, então é por
        aqui que se chega a ela. No desktop o menu lateral já tem o item.
      */}
      <Link
        to={ROUTES.categories}
        className="mt-6 flex min-h-14 items-center gap-3 rounded-xl border border-border bg-card px-4 text-card-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 lg:hidden"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
          <Tags className="size-5" aria-hidden="true" />
        </span>
        <span className="flex-1 font-medium">Gerenciar categorias</span>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Link>
    </div>
  );
}
