import { useId, useState, type CSSProperties, type Ref } from "react";
import { cn } from "cn";

import { PhoneMockup, type PhoneSize } from "@/features/showcase/PhoneMockup";
import { ScreenTabs } from "@/features/showcase/ScreenTabs";
import { Ticker } from "@/features/showcase/Ticker";
import { AccountsScreen } from "@/features/showcase/screens/AccountsScreen";
import { GoalsScreen } from "@/features/showcase/screens/GoalsScreen";
import { HomeScreen } from "@/features/showcase/screens/HomeScreen";
import { TransactionsScreen } from "@/features/showcase/screens/TransactionsScreen";
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
  /** A primeira tela (Início ou Contas) "se soma" ao aparecer (assinatura). */
  intro?: boolean;
  /** Atraso do início da soma, para combinar com o que acontece em volta do aparelho. */
  introDelayMs?: number;
  className?: string;
  phoneRef?: Ref<HTMLDivElement>;
  screenTheme?: "inverse" | "page";
};

/**
 * O app de exemplo dentro do iPhone (spec 003): cabeçalho com o número da tela, a tela ativa e
 * as abas, nas mesmas telas e na mesma ordem da barra do app no celular. Tudo é texto de verdade,
 * numa região rotulada como exemplo para o leitor de tela (RN2, RN6); a etiqueta visível saiu.
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
          <div className="px-2">
            <Ticker
              text={headline}
              className={cn(
                "text-3xl leading-tight font-semibold tracking-tight tabular-nums",
                definition.headlineDirection === "in" && "text-income",
                definition.headlineDirection === "out" && "text-expense",
                playIntro && "ticker-intro",
              )}
            />
          </div>

          <div
            key={screen}
            className={cn("mt-5 min-h-0 flex-1 overflow-hidden", view.changed && "screen-in")}
            style={{ "--screen-dir": view.direction } as CSSProperties}
          >
            {screen === "home" ? <HomeScreen intro={playIntro} spendingFirst={size === "peek"} /> : null}
            {screen === "transactions" ? <TransactionsScreen /> : null}
            {screen === "accounts" ? <AccountsScreen highlight={highlight} intro={playIntro} /> : null}
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
