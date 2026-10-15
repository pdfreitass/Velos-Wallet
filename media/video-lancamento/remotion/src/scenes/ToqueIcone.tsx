import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { VelosMark } from "../components/VelosMark";
import { velos } from "../theme";

/**
 * Cena 2 (4–6 s): o ícone do app é tocado e abre. É o beat que o template de lançamento pede;
 * aqui ele serve de ponte para a vitrine do produto.
 */
export function ToqueIcone() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrada = spring({ frame, fps, config: { damping: 200, mass: 0.6 } });
  // toque no frame 22: encolhe e volta
  const toque = interpolate(frame, [20, 24, 30], [1, 0.92, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // depois do toque, o ícone abre em tela
  const abrir = interpolate(frame, [32, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const escala = entrada * toque * (1 + abrir * 9);
  const raio = interpolate(abrir, [0, 1], [56, 0]);
  const opacidadeIcone = interpolate(frame, [48, 60], [1, 0], { extrapolateLeft: "clamp" });

  // onda do toque
  const ondaP = interpolate(frame, [22, 44], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <Backdrop flow={false} wires={false} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        {ondaP > 0 && ondaP < 1 ? (
          <div
            style={{
              position: "absolute",
              width: 260,
              height: 260,
              borderRadius: "50%",
              border: `3px solid ${velos.vivid}`,
              transform: `scale(${1 + ondaP * 2.2})`,
              opacity: (1 - ondaP) * 0.5,
            }}
          />
        ) : null}
        <div
          style={{
            width: 260,
            height: 260,
            borderRadius: raio,
            backgroundColor: velos.deep,
            border: `2px solid rgba(46,211,140,${0.5 * opacidadeIcone})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${escala})`,
            opacity: opacidadeIcone,
            boxShadow: `0 40px 120px rgba(0,0,0,0.45)`,
          }}
        >
          <VelosMark style={{ width: 118, height: 162 }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
