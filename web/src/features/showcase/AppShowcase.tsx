import { useId, useState, type CSSProperties, type Ref } from "react";
import { cn } from "cn";

import { PhoneMockup, type PhoneSize } from "@/features/showcase/PhoneMockup";
import { ScreenTabs } from "@/features/showcase/ScreenTabs";
import { Ticker } from "@/features/showcase/Ticker";
import { AccountsScreen } from "@/features/showcase/screens/AccountsScreen";
import { CategoriesScreen } from "@/features/showcase/screens/CategoriesScreen";
import { GoalsScreen } from "@/features/showcase/screens/GoalsScreen";
import { MonthScreen } from "@/features/showcase/screens/MonthScreen";
import {
  screenIndex,
  screens,
  type AccountId,
  type ScreenId,
} from "@/features/showcase/showcase-data";
import { formatCurrency, formatSignedCurrency } from "@/lib/utils/currency";

type AppShowcaseProps = {
  size: PhoneSize;
  screen: ScreenId;
  /** Sem ele, o aparelho é só vitrine (sem abas), como nas seções da página no celular. */
  onScreenChange?: (screen: ScreenId) => void;
  highlight?: AccountId | null;
  /** A primeira tela de contas "se soma" ao aparecer (assinatura). */
  intro?: boolean;
  /** Atraso do início da soma, para combinar com o que acontece em volta do aparelho. */
  introDelayMs?: number;
  className?: string;
  phoneRef?: Ref<HTMLDivElement>;
  screenTheme?: "inverse" | "page";
};

/**
 * O app de exemplo dentro do iPhone (spec 003): cabeçalho com o número da tela, a tela ativa e
 * as abas. Tudo é texto de verdade, numa região rotulada como exemplo (RN2, RN6).
 */
export function AppShowcase({
  size,
  screen,
  onScreenChange,
  highlight = null,
  intro = false,
  introDelayMs,
  className,
  phoneRef,
  screenTheme,
}: AppShowcaseProps) {
  const baseId = useId();
  // Direção da troca (para a tela deslizar do lado certo) e se o visitante já trocou de tela.
  const [view, setView] = useState({ screen, direction: 1, changed: false });
  if (view.screen !== screen) {
    setView({ screen, direction: screenIndex(screen) >= screenIndex(view.screen) ? 1 : -1, changed: true });
  }

  const definition = screens[screenIndex(screen)];
  const playIntro = intro && !view.changed;
  const panelId = `${baseId}-panel`;
  const tabId = (id: ScreenId) => `${baseId}-tab-${id}`;
  const headline = definition.headlineDirection
    ? formatSignedCurrency(definition.headlineCents, definition.headlineDirection)
    : formatCurrency(definition.headlineCents);

  return (
    <div
      role="region"
      aria-label={onScreenChange ? "Exemplo do app" : `Exemplo do app: ${definition.tab}`}
      className={cn("relative", className)}
      style={introDelayMs === undefined ? undefined : ({ "--sum-base": `${introDelayMs}ms` } as CSSProperties)}
    >
      <PhoneMockup size={size} ref={phoneRef} screenTheme={screenTheme}>
        <div
          id={panelId}
          role={onScreenChange ? "tabpanel" : undefined}
          aria-labelledby={onScreenChange ? tabId(screen) : undefined}
          className="flex min-h-0 flex-1 flex-col px-4 pt-2"
        >
          <p className="px-2 text-xs text-muted-foreground">{definition.headline}</p>
          <div className="flex items-end justify-between gap-2 px-2">
            <Ticker
              text={headline}
              className={cn(
                "text-3xl leading-tight font-semibold tracking-tight tabular-nums",
                definition.headlineDirection === "in" && "text-income",
                definition.headlineDirection === "out" && "text-expense",
                playIntro && "ticker-intro",
              )}
            />
            <span className="mb-1.5 rounded-md bg-muted px-2 py-0.5 text-xs font-medium">Exemplo</span>
          </div>

          <div
            key={screen}
            className={cn("mt-5 min-h-0 flex-1 overflow-hidden", view.changed && "screen-in")}
            style={{ "--screen-dir": view.direction } as CSSProperties}
          >
            {screen === "accounts" ? <AccountsScreen highlight={highlight} intro={playIntro} /> : null}
            {screen === "month" ? <MonthScreen /> : null}
            {screen === "categories" ? <CategoriesScreen /> : null}
            {screen === "goals" ? <GoalsScreen /> : null}
          </div>
        </div>

        {onScreenChange ? (
          <ScreenTabs screen={screen} onChange={onScreenChange} tabId={tabId} panelId={panelId} />
        ) : null}
        <div className="mx-auto mt-1 mb-2 h-1 w-28 shrink-0 rounded-full bg-foreground/85" aria-hidden="true" />
      </PhoneMockup>
    </div>
  );
}
