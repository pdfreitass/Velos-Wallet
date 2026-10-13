import type { ReactNode, Ref } from "react";
import { BatteryFull, SignalHigh, Wifi } from "lucide-react";
import { cn } from "cn";

export type PhoneSize = "hero" | "compact" | "peek" | "mini";

type PhoneMockupProps = {
  size: PhoneSize;
  /**
   * Tema da tela. "inverse" (padrão): o oposto da página, para o aparelho nunca se misturar com
   * o fundo (tela verde na página clara, off-white na escura). "page": o tema da página, usado
   * quando o iPhone já está numa área invertida (painel das telas de entrada).
   */
  screenTheme?: "inverse" | "page";
  children: ReactNode;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

/**
 * Moldura de iPhone desenhada em CSS (classes .phone* em globals.css). Tudo o que está dentro
 * da tela escala com a largura do aparelho: a tela redefine --spacing e os tamanhos de texto
 * do Tailwind em função de --phone-w, então p-4, text-sm e size-4 continuam valendo, só que
 * proporcionais ao aparelho. "peek" mostra só a parte de cima, para as seções no celular;
 * "mini" acompanha a janela de navegador do fechamento da página.
 */
export function PhoneMockup({ size, screenTheme = "inverse", children, className, ref }: PhoneMockupProps) {
  return (
    <div ref={ref} className={cn("phone", `phone--${size}`, className)}>
      <div
        className={cn(
          "phone-screen device-screen flex flex-col bg-background text-foreground",
          screenTheme === "inverse" ? "theme-inverse" : "theme-base",
        )}
      >
        <div className="phone-island" aria-hidden="true" />
        <div
          className="flex h-11 shrink-0 items-center justify-between px-7 pt-1 text-xs font-semibold tabular-nums"
          aria-hidden="true"
        >
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <SignalHigh className="size-3.5" />
            <Wifi className="size-3.5" />
            <BatteryFull className="size-4" />
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
