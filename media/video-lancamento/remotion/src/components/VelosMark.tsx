import type { CSSProperties } from "react";
import { velos } from "../theme";

/**
 * Mesma geometria de web/src/components/brand/VelosMark.tsx: a haste esquerda acompanha a cor
 * do texto, a direita (mais alta) é sempre o verde vivo — a "direção certa".
 *
 * `reveal` (0→1) descobre a marca de baixo para cima.
 */
export function VelosMark({
  color = velos.offWhite,
  reveal = 1,
  style,
}: {
  color?: string;
  reveal?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        ...style,
        overflow: "hidden",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <svg
        viewBox="318 245 442 608"
        style={{
          width: "100%",
          height: "100%",
          transform: `translateY(${(1 - reveal) * 100}%)`,
        }}
      >
        <polygon points="323,390 409,390 510,641 510,848" fill={color} />
        <polygon points="669,250 755,250 514,848 514,641" fill={velos.vivid} />
      </svg>
    </div>
  );
}
