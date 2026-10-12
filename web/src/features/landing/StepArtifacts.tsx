import type { CSSProperties } from "react";
import { ArrowDownLeft, ArrowUpRight, Plane, UtensilsCrossed, Wallet, type LucideIcon } from "lucide-react";
import { cn } from "cn";

import { cardAccount, goals, spendingByCategory } from "@/features/showcase/showcase-data";
import { formatCurrency, formatSignedCurrency } from "@/lib/utils/currency";

const cardShell =
  "stage-card rounded-2xl border border-border bg-card text-card-foreground shadow-[0_14px_30px_-14px_rgb(4_20_15/0.35)]";

type FlowCardProps = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  cents: number;
  direction: "in" | "out";
  rotate: number;
  className?: string;
};

/** Um lançamento "solto" da tela do mês, com sinal, cor e seta (nunca só a cor). */
function FlowCard({ icon: Icon, title, subtitle, cents, direction, rotate, className }: FlowCardProps) {
  const Arrow = direction === "in" ? ArrowDownLeft : ArrowUpRight;
  const tone = direction === "in" ? "text-income" : "text-expense";

  return (
    <div
      className={cn(cardShell, "flex w-max items-center gap-3 p-4", className)}
      style={{ "--card-rotate": `${rotate}deg`, "--depth": 0.6 } as CSSProperties}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{title}</span>
        <span className="block truncate text-sm text-muted-foreground">{subtitle}</span>
      </span>
      <span className={cn("flex items-center gap-1 font-semibold tabular-nums", tone)}>
        <Arrow className="size-4" aria-hidden="true" />
        {formatSignedCurrency(cents, direction)}
      </span>
    </div>
  );
}

/** Seção "Entrou, saiu, sobrou" no desktop: um salário entrando e uma compra saindo. */
export function MonthArtifacts() {
  return (
    <div className="relative h-44" aria-hidden="true">
      <FlowCard icon={Wallet} title="Salário" subtitle="Entrada" cents={420_000} direction="in" rotate={-3} />
      <FlowCard
        icon={UtensilsCrossed}
        title="Mercado"
        subtitle="Alimentação"
        cents={38_640}
        direction="out"
        rotate={2.5}
        className="absolute top-20 left-60"
      />
    </div>
  );
}

/** Seção "Metas que saem do papel" no desktop: a meta da viagem a 62%. */
export function GoalArtifact() {
  const goal = goals[0];

  return (
    <div
      className={cn(cardShell, "w-80 p-5")}
      style={{ "--card-rotate": "-2deg", "--depth": 0.6 } as CSSProperties}
      aria-hidden="true"
    >
      <p className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
          <Plane className="size-5" />
        </span>
        <span className="flex-1 font-medium">{goal.name}</span>
        <span className="text-lg font-semibold tabular-nums">{goal.percent}%</span>
      </p>
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-income" style={{ width: `${goal.percent}%` }} />
      </div>
      <p className="mt-2 text-sm text-muted-foreground tabular-nums">
        {formatCurrency(goal.savedCents)} de {formatCurrency(goal.targetCents)}
      </p>
    </div>
  );
}

/**
 * Fio que sai do cartão em direção ao iPhone fixo da coluna ao lado: o mesmo traço da primeira
 * dobra, para o motivo "tudo converge" continuar nas seções. `lit`: desenhado em verde vivo.
 */
function WireTail({ lit = false }: { lit?: boolean }) {
  return (
    <span className="hidden min-w-16 flex-1 items-center lg:flex" aria-hidden="true">
      <svg className="h-3 w-full overflow-visible" preserveAspectRatio="none">
        <line x1="0" y1="6" x2="100%" y2="6" className={lit ? "wire-lit" : "wire"} />
      </svg>
      <span
        className={cn(
          "size-2.5 shrink-0 rounded-full border-[1.5px]",
          lit ? "border-accent bg-accent" : "border-input bg-background",
        )}
      />
    </span>
  );
}

/** Seção "O cartão fica fora do saldo": o cartão escuro ligado à linha "Fora do saldo". */
export function CardArtifact() {
  return (
    <div className="flex items-center" aria-hidden="true">
      <div
        className="stage-card theme-inverse w-64 shrink-0 rounded-2xl bg-background p-5 text-foreground shadow-[0_14px_30px_-14px_rgb(4_20_15/0.45)]"
        style={{ "--card-rotate": "-3deg", "--depth": 0.6 } as CSSProperties}
      >
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <cardAccount.icon className="size-4" />
          {cardAccount.name}
        </p>
        <p className="mt-1.5 text-2xl font-semibold tracking-tight text-expense tabular-nums">
          {formatSignedCurrency(cardAccount.cents, "out")}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Fora do saldo total</p>
      </div>
      <WireTail lit />
    </div>
  );
}

/** Seção "Para onde vai seu dinheiro": as duas maiores categorias ligadas à rosca do iPhone. */
export function CategoryArtifacts() {
  return (
    <div className="space-y-5" aria-hidden="true">
      {spendingByCategory.slice(0, 2).map((category, index) => (
        <div key={category.name} className={cn("flex items-center", index === 1 && "pl-12")}>
          <div
            className={cn(cardShell, "flex w-max shrink-0 items-center gap-3 px-4 py-3")}
            style={{ "--card-rotate": index === 0 ? "-2deg" : "2deg", "--depth": 0.6 } as CSSProperties}
          >
            <span className="size-3 rounded-full" style={{ backgroundColor: category.color }} />
            <category.icon className="size-4.5 text-muted-foreground" />
            <span className="font-medium">{category.name}</span>
            <span className="font-semibold tabular-nums">{Math.round(category.share)}%</span>
          </div>
          <WireTail lit={index === 0} />
        </div>
      ))}
    </div>
  );
}
