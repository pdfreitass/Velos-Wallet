import { Plus, Wallet } from "lucide-react";
import { Link } from "react-router";
import { cn } from "cn";

import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/auth/routes";

/** CA6: sem nenhuma conta, primeiros passos em vez de saldos zerados. */
export function FirstSteps() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <Wallet className="size-6" aria-hidden="true" />
      </span>
      <h2 className="text-lg font-semibold">Comece cadastrando suas contas</h2>
      <p className="max-w-sm text-muted-foreground">
        Conta corrente, poupança, dinheiro e cartão, com o saldo de hoje. Depois é só lançar o que entra e o que sai.
      </p>
      <Link to={ROUTES.newAccount} className={cn(buttonVariants(), "mt-1 h-11 px-5 text-base")}>
        <Plus aria-hidden="true" />
        Adicionar conta
      </Link>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div aria-busy="true" className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <span role="status" className="sr-only">
        Carregando o resumo…
      </span>
      <div className="space-y-3">
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-44 rounded-2xl" />
        {/* Alto o bastante para caber a rosca (spec 010) e a lista, para a tela não saltar. */}
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </div>
  );
}
