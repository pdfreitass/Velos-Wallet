import { cn } from "cn";

import { AppShowcase } from "@/features/showcase/AppShowcase";
import { AccountsScreen } from "@/features/showcase/screens/AccountsScreen";
import { CategoriesScreen } from "@/features/showcase/screens/CategoriesScreen";
import { monthExpenseCents, totalBalanceCents } from "@/features/showcase/showcase-data";
import { formatCurrency, formatSignedCurrency } from "@/lib/utils/currency";

/**
 * "No celular e no computador": uma janela de navegador com o app em duas colunas e o iPhone
 * por cima, no canto. As mesmas telas da vitrine, em escala (.browser-screen em globals.css).
 * Decorativo: o conteúdo repete o exemplo da primeira dobra.
 */
export function DevicesIllustration({ className }: { className?: string }) {
  return (
    <div className={cn("devices relative pb-28", className)} aria-hidden="true">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_30px_60px_-24px_rgb(4_20_15/0.4)]">
        <div className="flex h-10 items-center gap-2 border-b border-border px-4">
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="mx-auto rounded-md bg-muted px-10 py-1 text-xs text-muted-foreground">Velos Wallet</span>
          <span className="w-12" />
        </div>

        <div className="browser-screen device-screen grid grid-cols-2 gap-8 bg-background p-8 pb-14 text-foreground">
          <div>
            <p className="px-2 text-xs text-muted-foreground">Saldo total</p>
            <p className="px-2 text-3xl font-semibold tracking-tight tabular-nums">{formatCurrency(totalBalanceCents)}</p>
            <div className="mt-5">
              <AccountsScreen />
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Gastos do mês</p>
            <p className="text-3xl font-semibold tracking-tight text-expense tabular-nums">
              {formatSignedCurrency(monthExpenseCents, "out")}
            </p>
            <div className="mt-5">
              <CategoriesScreen donutOnly />
            </div>
          </div>
        </div>
      </div>

      <AppShowcase size="mini" screen="month" className="absolute right-[-2.5rem] bottom-0" />
    </div>
  );
}
