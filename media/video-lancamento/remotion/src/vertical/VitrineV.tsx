import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BackdropV } from "./BackdropV";
import { FONT, velos } from "../theme";
import { MARGEM, POR_TELA } from "./temaVertical";
import { TelaContas, TelaGastos, TelaMes, TelaMetas } from "./tela/Telas";
import { saida } from "./tela/animacao";

/**
 * Cenas 3–6: as quatro telas do app, 3,2 s cada.
 *
 * Ao contrário da primeira versão, o aparelho não mostra capturas PNG: as telas são desenhadas em
 * código (`tela/Telas.tsx`) e animam por dentro — os números contam, as barras crescem, a rosca
 * se desenha. A troca entre telas é um deslize curto com fusão, não um corte seco.
 */

const TELAS = [
  { titulo: "Todas as contas\nnum lugar só", Componente: TelaContas },
  { titulo: "Quanto entrou,\nquanto saiu", Componente: TelaMes },
  { titulo: "Para onde\no dinheiro foi", Componente: TelaGastos },
  { titulo: "E quanto falta\npara a sua meta", Componente: TelaMetas },
] as const;

/** Quadros de sobreposição entre uma tela e a seguinte. */
const FUSAO = 12;
const TOTAL = POR_TELA * TELAS.length;

/**
 * Quanto o aparelho é ampliado sobre os 444 px em que a tela é desenhada.
 * A 1,10 o aparelho ocupa ~45% da largura do quadro: grande o bastante para os valores serem
 * legíveis no celular, sem encostar nos pontos de progresso.
 */
const ESCALA_APARELHO = 1.1;

export function VitrineV() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const indice = Math.min(Math.floor(frame / POR_TELA), TELAS.length - 1);
  const entrada = spring({ frame, fps, config: { damping: 200, mass: 0.9 } });
  const saidaCena = interpolate(frame, [TOTAL - 14, TOTAL], [1, 0], { extrapolateLeft: "clamp" });

  /**
   * Câmera: aproxima devagar durante cada tela e recua um pouco na troca, como um operador que
   * reenquadra. Sem isto o bloco fica parado no meio da tela e o vídeo "morre" entre os cortes.
   */
  const dentroDaTela = frame % POR_TELA;
  const aproxima = interpolate(dentroDaTela, [0, POR_TELA], [0, 1]);
  const escalaCamera = 1 + aproxima * 0.035;
  const derivaY = interpolate(aproxima, [0, 1], [8, -8]);

  return (
    <AbsoluteFill style={{ opacity: saidaCena }}>
      <BackdropV />

      <AbsoluteFill style={{ transform: `scale(${escalaCamera}) translateY(${derivaY}px)` }}>
        {/* Título */}
        {TELAS.map((item, i) => {
          const local = frame - i * POR_TELA;
          if (local < -FUSAO || local > POR_TELA) return null;
          const entra = saida(local / 16);
          const sai = interpolate(local, [POR_TELA - FUSAO, POR_TELA], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={item.titulo}
              style={{
                position: "absolute",
                left: MARGEM,
                right: MARGEM,
                top: 190,
                opacity: entra * sai,
                transform: `translateY(${(1 - entra) * 26}px)`,
              }}
            >
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: 90,
                  fontWeight: 600,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.06,
                  color: velos.offWhite,
                  whiteSpace: "pre-line",
                }}
              >
                {item.titulo}
              </div>
            </div>
          );
        })}

        {/* Aparelho: a moldura fica, o conteúdo desliza.
            O conteúdo é desenhado a 444 px e ampliado por ESCALA_APARELHO — assim os tamanhos
            relativos dentro da tela continuam os do app e só o conjunto cresce. */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 452,
            width: 444,
            height: 892,
            transform: `translateX(-50%) scale(${(0.94 + entrada * 0.06) * ESCALA_APARELHO})`,
            transformOrigin: "top center",
            opacity: entrada,
          }}
        >
          {TELAS.map((item, i) => {
            const local = frame - i * POR_TELA;
            if (local < -FUSAO || local > POR_TELA) return null;
            const Componente = item.Componente;

            // entra deslizando da direita, sai deslizando para a esquerda
            const entra = interpolate(local, [-FUSAO, 6], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const sai =
              i === TELAS.length - 1
                ? 1
                : interpolate(local, [POR_TELA - FUSAO, POR_TELA], [1, 0], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  });
            const deslocamento = (1 - entra) * 54 - (1 - sai) * 54;

            return (
              <div
                key={item.titulo}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: entra * sai,
                  transform: `translateX(${deslocamento}px)`,
                  filter: "drop-shadow(0 50px 110px rgba(0,0,0,0.55))",
                }}
              >
                <Componente frame={Math.max(0, local)} />
              </div>
            );
          })}
        </div>

        {/* Progresso das quatro telas */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 1478,
            display: "flex",
            justifyContent: "center",
            gap: 12,
            opacity: entrada,
          }}
        >
          {TELAS.map((item, i) => (
            <div
              key={item.titulo}
              style={{
                width: i === indice ? 44 : 12,
                height: 6,
                borderRadius: 999,
                backgroundColor: i === indice ? velos.vivid : "rgba(244,247,242,0.28)",
              }}
            />
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 1526,
            textAlign: "center",
            fontFamily: FONT,
            fontSize: 24,
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
