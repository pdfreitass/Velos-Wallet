import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { VelosMark } from "../components/VelosMark";
import { FONT, velos } from "../theme";

/** Cena 1 (0–4 s): a marca assenta e a frase aparece palavra a palavra. */
export function Abertura() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const markIn = spring({ frame, fps, config: { damping: 200, mass: 0.8 } });
  const reveal = interpolate(frame, [6, 34], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  const linhas = ["Seu dinheiro", "na direção certa."];

  // respiro de câmera: tudo cresce 2% ao longo da cena
  const breathe = interpolate(frame, [0, 120], [1, 1.02]);
  const saida = interpolate(frame, [104, 120], [1, 0], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: saida }}>
      <Backdrop flow={false} wires={false} />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 44,
          transform: `scale(${breathe})`,
        }}
      >
        <VelosMark
          reveal={reveal}
          style={{
            width: 120,
            height: 165,
            opacity: markIn,
          }}
        />
        <div style={{ textAlign: "center" }}>
          {linhas.map((linha, i) => {
            const delay = 24 + i * 10;
            const p = spring({ frame: frame - delay, fps, config: { damping: 200 } });
            return (
              <div
                key={linha}
                style={{
                  fontFamily: FONT,
                  fontSize: 104,
                  fontWeight: 600,
                  letterSpacing: "-0.035em",
                  lineHeight: 1.06,
                  color: i === 0 ? velos.offWhite : velos.offWhite,
                  opacity: p,
                  transform: `translateY(${(1 - p) * 26}px)`,
                }}
              >
                {linha}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
