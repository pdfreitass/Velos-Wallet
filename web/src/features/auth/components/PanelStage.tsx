import { useState, type CSSProperties, type ReactNode } from "react";
import { ArrowDownLeft, ArrowUpRight, Plane, UtensilsCrossed, Wallet } from "lucide-react";
import { cn } from "cn";

import { AppShowcase } from "@/features/showcase/AppShowcase";
import { goals, type ScreenId } from "@/features/showcase/showcase-data";
import { formatSignedCurrency } from "@/lib/utils/currency";

const viagem = goals[0];

/**
 * Palco do painel das telas de entrada: o iPhone compacto (tela no tema da página, para
 * contrastar com o painel invertido) e, a partir de 1280 px, três cartões do app encostados na
 * moldura (sem cobrir a tela), com a mesma linguagem da página inicial: um salário entrando,
 * uma compra saindo e uma meta.
 * Os cartões repetem o exemplo do aparelho e ficam fora do leitor de tela.
 */
export function PanelStage() {
  const [screen, setScreen] = useState<ScreenId>("accounts");

  return (
    <div className="relative w-fit">
      <AppShowcase size="compact" screen={screen} onScreenChange={setScreen} intro screenTheme="page" />

      <div aria-hidden="true" className="hidden xl:block">
        <FloatCard index={4} rotate={-4} className="top-[14%]">
          <Tile>
            <Wallet className="size-4" />
          </Tile>
          <Label title="Salário" subtitle="Entrada" />
          <Money direction="in" cents={420_000} />
        </FloatCard>

        <FloatCard index={5} rotate={3} className="top-[40%] translate-x-5">
          <Tile>
            <UtensilsCrossed className="size-4" />
          </Tile>
          <Label title="Mercado" subtitle="Compra" />
          <Money direction="out" cents={38_640} />
        </FloatCard>

        <FloatCard index={6} rotate={-2} className="top-[66%] flex-col items-stretch">
          <span className="flex items-center gap-3">
            <Tile>
              <Plane className="size-4" />
            </Tile>
            <Label title="Viagem" subtitle="Meta" />
            <span className="font-semibold tabular-nums">{viagem.percent}%</span>
          </span>
          <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-muted">
            <span className="block h-full rounded-full bg-income" style={{ width: `${viagem.percent}%` }} />
          </span>
        </FloatCard>
      </div>
    </div>
  );
}

type FloatCardProps = { index: number; rotate: number; className?: string; children: ReactNode };

/** Entra junto com a soma das contas no aparelho (.sum-row), depois das linhas dele. */
function FloatCard({ index, rotate, className, children }: FloatCardProps) {
  return (
    <div
      className={cn(
        "sum-row absolute left-[calc(100%-1rem)] flex w-60 items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-sm text-card-foreground",
        "shadow-[0_18px_36px_-16px_rgb(4_20_15/0.5)]",
        className,
      )}
      style={{ "--sum-index": index, rotate: `${rotate}deg` } as CSSProperties}
    >
      {children}
    </div>
  );
}

function Tile({ children }: { children: ReactNode }) {
  return <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted">{children}</span>;
}

function Label({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="block truncate font-medium">{title}</span>
      <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
    </span>
  );
}

/** Valor com sinal, cor e seta: nunca só a cor. */
function Money({ direction, cents }: { direction: "in" | "out"; cents: number }) {
  const Arrow = direction === "in" ? ArrowDownLeft : ArrowUpRight;
  return (
    <span
      className={cn(
        "flex items-center gap-0.5 font-semibold tabular-nums",
        direction === "in" ? "text-income" : "text-expense",
      )}
    >
      <Arrow className="size-3.5" />
      {formatSignedCurrency(cents, direction)}
    </span>
  );
}
