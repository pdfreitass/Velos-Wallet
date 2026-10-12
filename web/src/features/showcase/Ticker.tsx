import type { CSSProperties } from "react";
import { cn } from "cn";

/**
 * Número que troca como um contador de dígitos: cada caractere ocupa uma casa, contada da
 * direita (centavos com centavos, vírgula com vírgula). Ao mudar o texto, só as casas que
 * mudaram remontam e rolam para o lugar (animação em globals.css, desligada com "reduzir
 * movimento"). O leitor de tela recebe o texto inteiro, não letra por letra.
 */
export function Ticker({ text, className }: { text: string; className?: string }) {
  const chars = Array.from(text);

  return (
    <span className={cn("inline-flex", className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="inline-flex overflow-hidden">
        {chars.map((char, index) => {
          const fromRight = chars.length - index;
          return (
            <span
              key={`${fromRight}:${char}`}
              className="ticker-char whitespace-pre"
              style={{ "--ticker-index": fromRight } as CSSProperties}
            >
              {char}
            </span>
          );
        })}
      </span>
    </span>
  );
}
