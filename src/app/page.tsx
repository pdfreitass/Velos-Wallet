import Image from "next/image";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { formatCurrency, formatSignedCurrency } from "@/lib/utils/currency";
import { formatDate, formatMonthLabel } from "@/lib/utils/date";

/**
 * Pagina temporaria da Etapa 1: prova que o pipeline esta de pe (Tailwind v4,
 * shadcn, formatadores, identidade visual, tema claro/escuro). E substituida
 * pelo dashboard na Etapa 6.
 */
export default function Home() {
  const saldoCents = 123456;
  const receitaCents = 42000;
  const despesaCents = 18000;
  const hoje = "2026-10-01";

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-4">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Image
            src="/brand/velos-claro.png"
            alt=""
            width={40}
            height={40}
            className="rounded-lg dark:hidden"
            priority
          />
          <Image
            src="/brand/velos-escuro.png"
            alt=""
            width={40}
            height={40}
            className="hidden rounded-lg dark:block"
            priority
          />
          <div>
            <h1 className="text-xl font-semibold">Velos Wallet</h1>
            <p className="text-muted-foreground text-sm">
              Seu dinheiro na direcao certa.
            </p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Setup validado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Saldo total{" "}
            <strong className="font-mono text-base">
              {formatCurrency(saldoCents)}
            </strong>
          </p>
          <p>
            {/* Nunca so a cor: o sinal + e - carrega a mesma informacao. */}
            Receitas do mes{" "}
            <strong className="text-income font-mono">
              {formatSignedCurrency(receitaCents, "in")}
            </strong>
          </p>
          <p>
            Despesas do mes{" "}
            <strong className="text-expense font-mono">
              {formatSignedCurrency(despesaCents, "out")}
            </strong>
          </p>
          <p>
            Data (teste de fuso, deve mostrar 01/10/2026){" "}
            <strong className="font-mono">{formatDate(hoje)}</strong>
          </p>
          <p>
            Mes <strong className="font-mono">{formatMonthLabel(hoje)}</strong>
          </p>
          <div className="flex gap-2 pt-2">
            <Button>Acao principal</Button>
            <Button variant="outline">Secundaria</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
