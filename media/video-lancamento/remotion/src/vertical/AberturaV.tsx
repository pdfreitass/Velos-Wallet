import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BackdropV } from "./BackdropV";
import { VelosMark } from "../components/VelosMark";
import { FONT, velos } from "../theme";

/**
 * Cena 1 (0–3,6 s): a marca assenta e a frase entra linha a linha.
 *
 * Na vertical a frase quebra em três linhas curtas e o corpo sobe para o terço superior: é onde
 * o olho cai primeiro no feed, e deixa o rodapé livre para a interface do Reels.
 */
export function AberturaV() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const markIn = spring({ frame, fps, config: { damping: 200, mass: 0.8 } });
  const reveal = interpolate(frame, [4, 30], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const linhas = ["Seu dinheiro", "na direção", "certa."];

  const breathe = interpolate(frame, [0, 108], [1, 1.03]);
  const saida = interpolate(frame, [94, 108], [1, 0], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: saida }}>
      <BackdropV flow={false} wires={false} />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 56,
          transform: `scale(${breathe})`,
        }}
      >
        <VelosMark reveal={reveal} style={{ width: 150, height: 206, opacity: markIn }} />

        <div style={{ textAlign: "center" }}>
          {linhas.map((linha, i) => {
            const delay = 18 + i * 8;
            const p = spring({ frame: frame - delay, fps, config: { damping: 200 } });
            return (
              <div
                key={linha}
                style={{
                  fontFamily: FONT,
                  fontSize: 118,
                  fontWeight: 600,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.04,
                  color: velos.offWhite,
                  opacity: p,
                  transform: `translateY(${(1 - p) * 28}px)`,
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
