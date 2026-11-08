import { Fragment, useRef, type KeyboardEvent } from "react";
import { Plus } from "lucide-react";
import { cn } from "cn";

import { PLUS_SLOT, screens, type ScreenId } from "@/features/showcase/showcase-data";

type ScreenTabsProps = {
  screen: ScreenId;
  onChange: (screen: ScreenId) => void;
  tabId: (screen: ScreenId) => string;
  panelId: string;
};

/**
 * Barra de abas do app de exemplo, no padrão de abas do WAI-ARIA: um único ponto de Tab,
 * setas, Home e End trocam de tela (ativação automática). Alvo de toque de 44 px mesmo no
 * aparelho compacto. O "+" do meio copia a barra do app, mas é só desenho: fica fora do Tab e do
 * leitor de tela, e as setas pulam por cima dele.
 */
export function ScreenTabs({ screen, onChange, tabId, panelId }: ScreenTabsProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = screens.length - 1;
    const next =
      event.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : event.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : null;
    if (next === null) return;

    event.preventDefault();
    onChange(screens[next].id);
    tabRefs.current[next]?.focus();
  }

  return (
    <div role="tablist" aria-label="Telas do exemplo" className="grid shrink-0 grid-cols-5 border-t border-border px-2 pt-1">
      {screens.map((item, index) => {
        const selected = item.id === screen;
        return (
          <Fragment key={item.id}>
            {index === PLUS_SLOT ? <PlusSlot /> : null}
          <button
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            type="button"
            role="tab"
            id={tabId(item.id)}
            aria-selected={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "relative flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring",
              "before:absolute before:top-0 before:h-0.5 before:w-6 before:rounded-full",
              selected ? "text-foreground before:bg-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <item.icon className="size-5" aria-hidden="true" />
            {item.tab}
          </button>
          </Fragment>
        );
      })}
    </div>
  );
}

/** O botão "Nova transação" da barra do app, desenhado. */
function PlusSlot() {
  return (
    <span className="flex items-center justify-center" aria-hidden="true">
      <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
        <Plus className="size-5" strokeWidth={2.5} />
      </span>
    </span>
  );
}
