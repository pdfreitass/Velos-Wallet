import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BackdropV } from "./BackdropV";
import { VelosMark } from "../components/VelosMark";
import { FONT, velos } from "../theme";

/**
 * Cena 8 (24,2–28,8 s): a marca se desenha, entra o nome e a chamada.
 *
 * O bloco fica acima do centro para que o botão não caia atrás da legenda do Reels, e o último
 * segundo segura tudo parado: é o frame que a pessoa vê quando o vídeo repete.
 */
export function FechoV() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const reveal = interpolate(frame, [4, 32], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const nome = spring({ frame: frame - 24, fps, config: { damping: 200 } });
  const cta = spring({ frame: frame - 40, fps, config: { damping: 200 } });
  const assinatura = interpolate(frame, [56, 72], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <BackdropV flow={false} wires={false} />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 40,
          paddingBottom: 220,
        }}
      >
        <VelosMark reveal={reveal} style={{ width: 176, height: 242 }} />

        <div
          style={{
            fontFamily: FONT,
            fontSize: 104,
            fontWeight: 600,
            letterSpacing: "-0.04em",
            color: velos.offWhite,
            opacity: nome,
            transform: `translateY(${(1 - nome) * 18}px)`,
          }}
        >
          Velos Wallet
        </div>

        <div
          style={{
            marginTop: 8,
            padding: "26px 60px",
            borderRadius: 999,
            backgroundColor: velos.vivid,
            color: velos.deep,
            fontFamily: FONT,
            fontSize: 42,
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
            fontSize: 30,
            color: "rgba(244,247,242,0.55)",
            opacity: assinatura,
          }}
        >
          Seu dinheiro na direção certa.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
