import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { velos } from "../theme";

/**
 * Mesma assinatura visual do Backdrop 16:9 — verde profundo e linhas tracejadas que convergem —
 * redesenhada para 1080×1920. Na vertical as linhas sobem da base até o centro, onde fica o
 * aparelho, em vez de atravessarem a tela da esquerda para a direita.
 */
export function BackdropV({ flow = true, wires = true }: { flow?: boolean; wires?: boolean }) {
  const frame = useCurrentFrame();
  const dash = frame * -0.6;

  const tracos = [
    "M -80 1980 C 240 1620, 300 1180, 540 860",
    "M 1160 1980 C 840 1620, 780 1180, 540 860",
    "M -80 1700 C 320 1500, 420 1160, 540 880",
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: velos.deep }}>
      {/* brilho suave atrás do aparelho, agora no centro-alto */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(52% 34% at 50% 54%, rgba(46,211,140,0.16) 0%, rgba(46,211,140,0) 72%)",
        }}
      />
      <svg
        viewBox="0 0 1080 1920"
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
            d="M -80 1980 C 240 1620, 300 1180, 540 860"
            fill="none"
            stroke={velos.vivid}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray="2000"
            strokeDashoffset={interpolate(frame, [0, 90], [2000, 0], {
              extrapolateRight: "clamp",
            })}
            opacity={0.75}
          />
        ) : null}
      </svg>
    </AbsoluteFill>
  );
}
