import { Plus } from "lucide-react";
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
    </div>
  );
}
