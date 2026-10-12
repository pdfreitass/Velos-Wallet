import type { CSSProperties, RefObject } from "react";

import { useConvergeStage } from "@/features/landing/useConvergeStage";
import type { AccountId } from "@/features/showcase/showcase-data";

type ConvergeWiresProps = {
  stageRef: RefObject<HTMLElement | null>;
  heroRef: RefObject<HTMLElement | null>;
  phoneRef: RefObject<HTMLElement | null>;
  cardRefs: RefObject<Map<AccountId, HTMLElement>>;
  activeId: AccountId | null;
};

/**
 * Os fios da primeira dobra: tracejado neutro em repouso, um pulso verde que percorre cada fio
 * uma vez ao abrir (assinatura) e o fio da conta destacada desenhado em verde vivo. Decorativo:
 * a mesma informação está nos cartões e no iPhone.
 *
 * A geometria vive AQUI (e não no Story): ela muda a cada quadro da inclinação com o mouse, e só
 * este SVG precisa redesenhar, não a página inteira.
 */
export function ConvergeWires({ stageRef, heroRef, phoneRef, cardRefs, activeId }: ConvergeWiresProps) {
  const { wires, fade } = useConvergeStage({ stageRef, heroRef, phoneRef, cardRefs });
  if (wires.length === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-0 size-full overflow-visible"
      style={{ opacity: fade, visibility: fade === 0 ? "hidden" : undefined }}
      aria-hidden="true"
    >
      {wires.map((wire, index) => (
        <g key={wire.id} data-active={activeId === wire.id ? "" : undefined}>
          <path className="wire" d={wire.d} />
          <path className="wire-active" d={wire.d} pathLength={1} />
          <path
            className="wire-pulse"
            d={wire.d}
            pathLength={1}
            style={{ "--wire-index": index } as CSSProperties}
          />
          <circle className="wire-port" cx={wire.endX} cy={wire.endY} r={4} />
        </g>
      ))}
    </svg>
  );
}
