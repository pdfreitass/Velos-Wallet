import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BackdropV } from "./BackdropV";
import { FONT, velos } from "../theme";
import { MARGEM } from "./temaVertical";

/**
 * Cena 7 (20,6–24,2 s): as duas promessas que não cabem num saldo — abre no navegador e é
 * privado por padrão.
 *
 * A captura é a própria página inicial no celular (`13-home-375-escuro`), recortada no topo:
 * é a prova visual de "abre no navegador". Uma captura 16:9 ficaria pequena demais aqui.
 */
export function PrivacidadeV() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const total = 108;

  const entrada = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const saida = interpolate(frame, [total - 14, total], [1, 0], { extrapolateLeft: "clamp" });
  const cartao = spring({ frame: frame - 6, fps, config: { damping: 200, mass: 0.9 } });
  const texto = spring({ frame: frame - 10, fps, config: { damping: 200 } });
  const apoio = spring({ frame: frame - 22, fps, config: { damping: 200 } });

  const zoom = interpolate(frame, [0, total], [1.0, 1.04]);

  return (
    <AbsoluteFill style={{ opacity: entrada * saida }}>
      <BackdropV flow wires={false} />

      <div
        style={{
          position: "absolute",
          left: MARGEM,
          right: MARGEM,
          top: 196,
          opacity: texto,
          transform: `translateY(${(1 - texto) * 24}px)`,
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontSize: 92,
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.06,
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
            fontSize: 34,
            lineHeight: 1.42,
            color: velos.mutedDark,
            opacity: apoio,
          }}
        >
          Abre direto no navegador. Privado por padrão: só você vê seus dados.
        </div>
      </div>

      {/* A própria página no celular, recortada no topo: é a prova de "abre no navegador". */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 528,
          width: 568,
          height: 772,
          transform: `translateX(-50%) scale(${(0.94 + cartao * 0.06) * zoom})`,
          borderRadius: 30,
          overflow: "hidden",
          border: "1px solid rgba(244,247,242,0.14)",
          boxShadow: "0 60px 140px rgba(0,0,0,0.55)",
          opacity: cartao,
          lineHeight: 0,
        }}
      >
        <Img
          src={staticFile("shots/13-home-375-escuro.png")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "top center",
          }}
        />
        {/* a página continua abaixo do recorte: o degradê diz isso sem cortar nada no meio */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 180,
            background: `linear-gradient(to bottom, rgba(10,46,36,0) 0%, ${velos.deep} 92%)`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
}
