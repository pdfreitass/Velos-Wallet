import type { CSSProperties, PointerEvent, RefObject } from "react";
import { cn } from "cn";

import { allAccounts, type AccountId } from "@/features/showcase/showcase-data";
import { formatCurrency, formatSignedCurrency } from "@/lib/utils/currency";

/** Onde cada cartão "flutua" no desktop (% do campo), sua inclinação e a profundidade no mouse. */
const layout: Record<AccountId, { x: string; y: string; rotate: number; depth: number }> = {
  checking: { x: "0%", y: "0%", rotate: -4, depth: 1.2 },
  savings: { x: "39%", y: "22%", rotate: 3, depth: 0.8 },
  cash: { x: "6%", y: "45%", rotate: 2, depth: 1 },
  card: { x: "50%", y: "68%", rotate: -3, depth: 1.4 },
};
// As alturas seguem a ordem das linhas no iPhone e cada fio passa num corredor livre (o do
// Dinheiro entre a Poupança e o Cartão): assim nenhum fio cruza outro nem some atrás de um cartão.

type AccountCardsProps = {
  cardRefs: RefObject<Map<AccountId, HTMLElement>>;
  activeId: AccountId | null;
  onHover: (id: AccountId | null) => void;
  onSelect: (id: AccountId) => void;
  className?: string;
};

/**
 * As quatro contas espalhadas, de onde saem os fios para o iPhone. Cada uma é um botão: passar o
 * mouse ou focar acende o fio e a linha da conta no aparelho; tocar leva o aparelho para Contas.
 * O cartão de crédito usa o tema invertido (verde profundo na página clara) e mostra a dívida.
 */
export function AccountCards({ cardRefs, activeId, onHover, onSelect, className }: AccountCardsProps) {
  const onMouse = (id: AccountId | null) => (event: PointerEvent) => {
    if (event.pointerType === "mouse") onHover(id);
  };

  return (
    <div className={cn("flex flex-col", className)}>
      {/* No celular a legenda vem antes: embaixo os fios descem até o aparelho. */}
      <p className="mb-3 text-xs text-muted-foreground lg:order-last lg:mt-4 lg:mb-0">Valores de exemplo.</p>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:relative lg:block lg:h-[clamp(17rem,38svh,23rem)]">
        {allAccounts.map((account) => {
          const { x, y, rotate, depth } = layout[account.id];
          const debt = account.id === "card";
          const value = debt ? formatSignedCurrency(account.cents, "out") : formatCurrency(account.cents);

          return (
            <button
              key={account.id}
              ref={(element) => {
                if (element) cardRefs.current.set(account.id, element);
                else cardRefs.current.delete(account.id);
              }}
              type="button"
              data-active={activeId === account.id ? "" : undefined}
              onPointerEnter={onMouse(account.id)}
              onPointerLeave={onMouse(null)}
              onFocus={() => onHover(account.id)}
              onBlur={() => onHover(null)}
              onClick={() => onSelect(account.id)}
              className={cn(
                "stage-card relative z-10 flex min-w-0 flex-col justify-between rounded-2xl border p-4 text-left outline-none",
                "shadow-[0_14px_30px_-14px_rgb(4_20_15/0.35)] focus-visible:ring-3 focus-visible:ring-ring/60",
                "data-active:border-accent data-active:shadow-[0_20px_40px_-16px_rgb(4_20_15/0.45)]",
                "lg:absolute lg:top-(--y) lg:left-(--x) lg:w-[clamp(12.5rem,16vw,14.75rem)] lg:p-5",
                debt ? "theme-inverse border-transparent bg-background text-foreground" : "border-border bg-card text-card-foreground",
              )}
              style={
                {
                  "--x": x,
                  "--y": y,
                  "--card-rotate": `${rotate / 2}deg`,
                  "--card-rotate-lg": `${rotate}deg`,
                  "--depth": depth,
                } as CSSProperties
              }
            >
              <span className="flex items-start gap-2 text-sm leading-tight text-muted-foreground">
                <account.icon className="mt-px size-4 shrink-0" aria-hidden="true" />
                <span className="lg:truncate">{account.name}</span>
              </span>
              <span
                className={cn(
                  "mt-1.5 text-lg font-semibold tracking-tight tabular-nums sm:text-xl lg:text-2xl",
                  debt && "text-expense",
                )}
              >
                {value}
              </span>
              {/* O nome acessível começa pelo texto visível (WCAG 2.5.3) e termina na ação. */}
              <span className="sr-only">. Mostrar no exemplo do app</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
