import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Backdrop } from "../components/Backdrop";
import { FONT, velos } from "../theme";

/**
 * Cena 7 (18,8–22 s): a tela de entrada real, apresentada como um cartão flutuante sobre o verde
 * da marca — a captura é clara demais para receber texto por cima. Diz as duas promessas que não
 * cabem num saldo: privado por padrão e sem loja de apps.
 */
export function Entrar() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const total = 96;

  const entrada = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const saida = interpolate(frame, [total - 14, total], [1, 0], { extrapolateLeft: "clamp" });
  const cartao = spring({ frame, fps, config: { damping: 200, mass: 0.9 } });
  const texto = spring({ frame: frame - 14, fps, config: { damping: 200 } });

  // aproximação lenta de câmera sobre o cartão
  const zoom = interpolate(frame, [0, total], [1.0, 1.05]);

  return (
    <AbsoluteFill style={{ opacity: entrada * saida }}>
      <Backdrop flow wires={false} />

      <div
        style={{
          position: "absolute",
          left: 128,
          top: 318,
          width: 640,
          opacity: texto,
          transform: `translateY(${(1 - texto) * 22}px)`,
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontSize: 74,
            fontWeight: 600,
            letterSpacing: "-0.035em",
            lineHeight: 1.08,
            color: velos.offWhite,
          }}
        >
          Sem loja
          <br />
          de apps.
        </div>
        <div
          style={{
            marginTop: 26,
            fontFamily: FONT,
            fontSize: 30,
            lineHeight: 1.45,
            color: velos.mutedDark,
          }}
        >
          Abre direto no navegador, no celular e no computador. Privado por padrão: só você vê
          seus dados.
        </div>
      </div>

      {/* a captura, como uma janela */}
      <div
        style={{
          position: "absolute",
          right: 96,
          top: "50%",
          width: 1020,
          transform: `translateY(-50%) scale(${(0.94 + cartao * 0.06) * zoom})`,
          borderRadius: 24,
          overflow: "hidden",
          border: "1px solid rgba(244,247,242,0.14)",
          boxShadow: "0 60px 140px rgba(0,0,0,0.55)",
          opacity: cartao,
          lineHeight: 0,
        }}
      >
        <Img
          src={staticFile("shots/12-entrar-16x9-escuro.png")}
          style={{ width: "100%", height: "auto" }}
        />
      </div>
    </AbsoluteFill>
  );
}
