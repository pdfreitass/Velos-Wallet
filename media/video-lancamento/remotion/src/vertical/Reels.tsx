import {
  AbsoluteFill,
  Audio,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useEffect, useState } from "react";
import { AberturaV } from "./AberturaV";
import { ToqueIconeV } from "./ToqueIconeV";
import { VitrineV } from "./VitrineV";
import { PrivacidadeV } from "./PrivacidadeV";
import { FechoV } from "./FechoV";
import { CUES_V, DURACAO_V } from "./temaVertical";
import { velos } from "../theme";
import falasJson from "./falas.json";

type Fala = { id: string; entra: number; cabe: number; texto: string; dura?: number };
const FALAS: Fala[] = falasJson.falas;

/** Quanto a música desce enquanto a voz fala: −14 dB. */
const PISO_DUCK = 0.20;
/** A música começa a descer um pouco antes da fala e volta mais devagar do que desceu. */
const ATAQUE_DUCK = 0.15;
const SOLTURA_DUCK = 0.5;
/**
 * Reforço da voz sobre a mistura. As faixas já saem a −16 LUFS, mas numa peça com música por
 * baixo a locução precisa de destacar-se com folga — num celular, no feed, com som ambiente.
 */
const GANHO_VOZ = 1.6;

/**
 * Ganho da trilha em função do tempo, com a voz abrindo espaço.
 *
 * Usa `dura` — a duração real do arquivo, medida e gravada por `scripts/gerar-locucao.mjs` — e
 * não `cabe`, que é a janela reservada. Com `cabe` o ducking de uma fala encosta no da seguinte
 * (as falas distam 3,8 s e a janela é 3,2 s) e a música fica abafada o vídeo inteiro. Com a
 * duração real sobra ~1 s de música plena entre as frases, que é o que dá respiro à peça.
 *
 * O fallback para `cabe` só vale enquanto a locução não foi gerada nenhuma vez.
 */
function ganhoDaTrilha(segundos: number): number {
  let ganho = 1;
  for (const fala of FALAS) {
    const fim = fala.entra + (fala.dura ?? fala.cabe);
    if (segundos < fala.entra - ATAQUE_DUCK || segundos > fim + SOLTURA_DUCK) continue;

    const valor =
      segundos < fala.entra
        ? interpolate(segundos, [fala.entra - ATAQUE_DUCK, fala.entra], [1, PISO_DUCK])
        : segundos <= fim
          ? PISO_DUCK
          : interpolate(segundos, [fim, fim + SOLTURA_DUCK], [PISO_DUCK, 1]);

    ganho = Math.min(ganho, valor);
  }
  return ganho;
}

/**
 * Versão vertical do vídeo de lançamento: 28,8 s a 30 fps, 1080×1920, com trilha, efeitos e
 * locução. Formato de Reels e TikTok. A versão 16:9 continua em `Lancamento.tsx`, intacta.
 *
 * As faixas de voz precisam existir antes do render:
 *   npm run locucao   (rascunho com a voz do Windows)
 *   npm run locucao:11labs -- --voz <voice_id>   (versão final)
 */
export function Reels() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [handle] = useState(() => delayRender("Carregando a fonte Geist"));

  useEffect(() => {
    const fonte = new FontFace(
      "Geist Velos",
      `url(${staticFile("fonts/geist.woff2")}) format("woff2")`,
      { weight: "100 900" },
    );
    fonte
      .load()
      .then((carregada) => {
        (document.fonts as FontFaceSet & { add(f: FontFace): void }).add(carregada);
        return document.fonts.ready;
      })
      .then(() => continueRender(handle))
      .catch(() => continueRender(handle)); // sem a Geist, cai no system-ui
  }, [handle]);

  // guarda curta nas pontas: a trilha já tem ataque e cauda próprios
  const envelope = interpolate(
    frame,
    [0, 6, DURACAO_V - 6, DURACAO_V],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: velos.deep }}>
      <Audio
        src={staticFile("audio/trilha.wav")}
        volume={envelope * ganhoDaTrilha(frame / fps)}
      />

      {FALAS.map((fala) => (
        <Sequence key={fala.id} from={Math.round(fala.entra * fps)}>
          <Audio src={staticFile(`audio/voz/${fala.id}.wav`)} volume={GANHO_VOZ} />
        </Sequence>
      ))}

      <Sequence from={CUES_V.abertura.from} durationInFrames={CUES_V.abertura.duration}>
        <AberturaV />
      </Sequence>

      <Sequence from={CUES_V.icone.from} durationInFrames={CUES_V.icone.duration}>
        <ToqueIconeV />
      </Sequence>

      <Sequence from={CUES_V.vitrine.from} durationInFrames={CUES_V.vitrine.duration}>
        <VitrineV />
      </Sequence>

      <Sequence from={CUES_V.privacidade.from} durationInFrames={CUES_V.privacidade.duration}>
        <PrivacidadeV />
      </Sequence>

      <Sequence from={CUES_V.fecho.from} durationInFrames={CUES_V.fecho.duration}>
        <FechoV />
      </Sequence>
    </AbsoluteFill>
  );
}
