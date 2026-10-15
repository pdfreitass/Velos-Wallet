import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { VelosMark } from "../components/VelosMark";
import { FONT, velos } from "../theme";

/** Cena 8 (22–26 s): a marca se desenha e entra a chamada. */
export function Fecho() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const reveal = interpolate(frame, [4, 34], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const nome = spring({ frame: frame - 26, fps, config: { damping: 200 } });
  const cta = spring({ frame: frame - 44, fps, config: { damping: 200 } });
  const site = interpolate(frame, [62, 78], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fim = interpolate(frame, [108, 120], [1, 0], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: fim }}>
      <Backdrop flow={false} wires={false} />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 34,
        }}
      >
        <VelosMark reveal={reveal} style={{ width: 150, height: 206 }} />

        <div
          style={{
            fontFamily: FONT,
            fontSize: 92,
            fontWeight: 600,
            letterSpacing: "-0.035em",
            color: velos.offWhite,
            opacity: nome,
            transform: `translateY(${(1 - nome) * 18}px)`,
          }}
        >
          Velos Wallet
        </div>

        <div
          style={{
            marginTop: 12,
            padding: "22px 52px",
            borderRadius: 999,
            backgroundColor: velos.vivid,
            color: velos.deep,
            fontFamily: FONT,
            fontSize: 36,
            fontWeight: 600,
            opacity: cta,
            transform: `scale(${0.92 + cta * 0.08})`,
          }}
        >
          Crie sua conta grátis
        </div>

        <div
          style={{
            marginTop: 10,
            fontFamily: FONT,
            fontSize: 26,
            color: "rgba(244,247,242,0.55)",
            opacity: site,
          }}
        >
          Seu dinheiro na direção certa.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
