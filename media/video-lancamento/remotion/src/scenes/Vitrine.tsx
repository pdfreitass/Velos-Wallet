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
 * Cenas 3–6 (6–18,8 s): as quatro telas da vitrine do app, 3,2 s cada.
 *
 * O aparelho fica parado e só o conteúdo troca por fusão — as molduras das quatro capturas são
 * idênticas e alinhadas, então a leitura é "a tela mudou", como no app de verdade. São telas de
 * demonstração: os valores são de exemplo, e as capturas trazem o selo "Exemplo".
 */

const TELAS = [
  {
    arquivo: "shots/02-app-contas-escuro.png",
    titulo: "Todas as contas\nnum lugar só",
    apoio: "Banco, poupança, dinheiro e cartão viram um saldo que você entende.",
  },
  {
    arquivo: "shots/04-app-mes-escuro.png",
    titulo: "Quanto entrou,\nquanto saiu",
    apoio: "O mês fechado numa linha só, com o que sobrou em destaque.",
  },
  {
    arquivo: "shots/06-app-gastos-escuro.png",
    titulo: "Para onde\no dinheiro foi",
    apoio: "Cada gasto com categoria, somado e ordenado pelo que mais pesa.",
  },
  {
    arquivo: "shots/08-app-metas-escuro.png",
    titulo: "E quanto falta\npara a sua meta",
    apoio: "Viagem, reserva, uma compra grande: com prazo e com número.",
  },
] as const;

const POR_TELA = 96;
const FUSAO = 14;

export function Vitrine() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const indice = Math.min(Math.floor(frame / POR_TELA), TELAS.length - 1);

  // zoom digital lento sobre o bloco inteiro
  const escalaBloco = interpolate(frame, [0, POR_TELA * TELAS.length], [1, 1.05]);
  const entrada = spring({ frame, fps, config: { damping: 200, mass: 0.9 } });
  const saida = interpolate(frame, [POR_TELA * TELAS.length - 14, POR_TELA * TELAS.length], [1, 0], {
    extrapolateLeft: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: saida }}>
      <Backdrop />

      <AbsoluteFill style={{ transform: `scale(${escalaBloco})` }}>
        {/* Texto, à esquerda */}
        {TELAS.map((tela, i) => {
          const local = frame - i * POR_TELA;
          const dentro = local >= -FUSAO && local <= POR_TELA;
          if (!dentro) return null;
          const p = spring({ frame: local, fps, config: { damping: 200 } });
          const sai = interpolate(local, [POR_TELA - FUSAO, POR_TELA], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={tela.arquivo}
              style={{
                position: "absolute",
                left: 140,
                top: 330,
                width: 760,
                opacity: p * sai,
                transform: `translateY(${(1 - p) * 24}px)`,
              }}
            >
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: 82,
                  fontWeight: 600,
                  letterSpacing: "-0.035em",
                  lineHeight: 1.08,
                  color: velos.offWhite,
                  whiteSpace: "pre-line",
                }}
              >
                {tela.titulo}
              </div>
              <div
                style={{
                  marginTop: 28,
                  fontFamily: FONT,
                  fontSize: 30,
                  fontWeight: 400,
                  lineHeight: 1.45,
                  color: velos.mutedDark,
                  maxWidth: 620,
                }}
              >
                {tela.apoio}
              </div>
            </div>
          );
        })}

        {/* Aparelho, à direita: fixo, só o conteúdo troca */}
        <div
          style={{
            position: "absolute",
            right: 210,
            top: "50%",
            transform: `translateY(-50%) scale(${0.94 + entrada * 0.06})`,
            width: 452,
            height: 926,
            opacity: entrada,
            filter: "drop-shadow(0 50px 110px rgba(0,0,0,0.55))",
          }}
        >
          {TELAS.map((tela, i) => {
            const local = frame - i * POR_TELA;
            const opacidade =
              i === 0
                ? interpolate(local, [POR_TELA - FUSAO, POR_TELA], [1, 0], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  })
                : interpolate(
                    local,
                    [-FUSAO, 0, POR_TELA - FUSAO, POR_TELA],
                    [0, 1, 1, i === TELAS.length - 1 ? 1 : 0],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                  );
            if (opacidade <= 0) return null;
            return (
              <Img
                key={tela.arquivo}
                src={staticFile(tela.arquivo)}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  opacity: opacidade,
                }}
              />
            );
          })}
        </div>

        {/* Pontos de progresso das quatro telas */}
        <div
          style={{
            position: "absolute",
            left: 140,
            bottom: 150,
            display: "flex",
            gap: 12,
            opacity: entrada,
          }}
        >
          {TELAS.map((tela, i) => (
            <div
              key={tela.arquivo}
              style={{
                width: i === indice ? 40 : 12,
                height: 6,
                borderRadius: 999,
                backgroundColor: i === indice ? velos.vivid : "rgba(244,247,242,0.28)",
                transition: "none",
              }}
            />
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            left: 140,
            bottom: 96,
            fontFamily: FONT,
            fontSize: 22,
            color: "rgba(244,247,242,0.5)",
            opacity: entrada,
          }}
        >
          Telas de demonstração. Valores de exemplo.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
