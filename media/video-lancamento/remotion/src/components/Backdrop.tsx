import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { velos } from "../theme";

/**
 * Fundo verde profundo com as linhas tracejadas que convergem — a assinatura visual da página
 * inicial do Velos (features/landing/ConvergeWires.tsx). O traço corre devagar.
 */
export function Backdrop({ flow = true, wires = true }: { flow?: boolean; wires?: boolean }) {
  const frame = useCurrentFrame();
  const dash = frame * -0.6;

  const tracos = [
    "M -100 760 C 420 760, 640 620, 1240 520",
    "M -100 1060 C 430 1060, 700 740, 1240 560",
    "M -100 1360 C 460 1360, 760 820, 1240 600",
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: velos.deep }}>
      {/* brilho suave atrás do aparelho */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(60% 50% at 72% 50%, rgba(46,211,140,0.14) 0%, rgba(46,211,140,0) 70%)",
        }}
      />
      <svg
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        {wires
          ? tracos.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                stroke="rgba(244,247,242,0.13)"
                strokeWidth={2}
                strokeDasharray="10 14"
                strokeDashoffset={flow ? dash : 0}
              />
            ))
          : null}
        {/* a linha viva: a que "chega" ao saldo */}
        {wires ? (
          <path
            d="M -100 1060 C 430 1060, 700 740, 1240 560"
            fill="none"
            stroke={velos.vivid}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray="1600"
            strokeDashoffset={interpolate(frame, [0, 90], [1600, 0], {
              extrapolateRight: "clamp",
            })}
            opacity={0.75}
          />
        ) : null}
      </svg>
    </AbsoluteFill>
  );
}
