import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BackdropV } from "./BackdropV";
import { VelosMark } from "../components/VelosMark";
import { velos } from "../theme";

/**
 * Cena 2 (3,6–5,4 s): o ícone do app é tocado e abre em tela.
 *
 * Versão curta da cena 16:9 — 54 frames em vez de 60 — e com abertura mais larga, porque a
 * diagonal de 1080×1920 é maior e o ícone precisa cobrir a tela inteira antes do corte.
 */
export function ToqueIconeV() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrada = spring({ frame, fps, config: { damping: 200, mass: 0.6 } });
  // toque no frame 18: encolhe e volta
  const toque = interpolate(frame, [16, 20, 26], [1, 0.92, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const abrir = interpolate(frame, [28, 54], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const escala = entrada * toque * (1 + abrir * 12);
  const raio = interpolate(abrir, [0, 1], [60, 0]);
  const opacidadeIcone = interpolate(frame, [42, 54], [1, 0], { extrapolateLeft: "clamp" });

  const ondaP = interpolate(frame, [18, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <BackdropV flow={false} wires={false} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        {ondaP > 0 && ondaP < 1 ? (
          <div
            style={{
              position: "absolute",
              width: 300,
              height: 300,
              borderRadius: "50%",
              border: `3px solid ${velos.vivid}`,
              transform: `scale(${1 + ondaP * 2.4})`,
              opacity: (1 - ondaP) * 0.5,
            }}
          />
        ) : null}
        <div
          style={{
            width: 300,
            height: 300,
            borderRadius: raio,
            backgroundColor: velos.deep,
            border: `2px solid rgba(46,211,140,${0.5 * opacidadeIcone})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${escala})`,
            opacity: opacidadeIcone,
            boxShadow: "0 40px 120px rgba(0,0,0,0.45)",
          }}
        >
          <VelosMark style={{ width: 136, height: 187 }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
