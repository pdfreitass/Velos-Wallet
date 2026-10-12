import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatSignedCurrency } from "@/lib/utils/currency";
import { formatDate, formatMonthLabel } from "@/lib/utils/date";

/**
 * Página TEMPORÁRIA (spec 001, T10): prova que o front novo está de pé
 * (Vite, Tailwind v4, shadcn, formatadores, identidade visual, tema).
 * É substituída pelo roteador na T16.
 */
export function App() {
  const balanceCents = 123456;
  const incomeCents = 42000;
  const expenseCents = 18000;
  const today = "2026-10-01";

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-4">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/brand/velos-claro.png" alt="" width={40} height={40} className="rounded-lg dark:hidden" />
          <img src="/brand/velos-escuro.png" alt="" width={40} height={40} className="hidden rounded-lg dark:block" />
          <div>
            <h1 className="text-xl font-semibold">Velos Wallet</h1>
            <p className="text-muted-foreground text-sm">Seu dinheiro na direção certa.</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Front em Vite validado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Saldo total <strong className="font-mono text-base">{formatCurrency(balanceCents)}</strong>
          </p>
          <p>
            {/* Nunca só a cor: o sinal + e - carrega a mesma informação. */}
            Receitas do mês{" "}
            <strong className="text-income font-mono">{formatSignedCurrency(incomeCents, "in")}</strong>
          </p>
          <p>
            Despesas do mês{" "}
            <strong className="text-expense font-mono">{formatSignedCurrency(expenseCents, "out")}</strong>
          </p>
          <p>
            Data (teste de fuso, deve mostrar 01/10/2026) <strong className="font-mono">{formatDate(today)}</strong>
          </p>
          <p>
            Mês <strong className="font-mono">{formatMonthLabel(today)}</strong>
          </p>
          <div className="flex gap-2 pt-2">
            <Button>Ação principal</Button>
            <Button variant="outline">Secundária</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
