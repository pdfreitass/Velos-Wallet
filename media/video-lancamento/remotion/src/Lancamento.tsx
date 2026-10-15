import { AbsoluteFill, Sequence, continueRender, delayRender, staticFile } from "remotion";
import { useEffect, useState } from "react";
import { Abertura } from "./scenes/Abertura";
import { ToqueIcone } from "./scenes/ToqueIcone";
import { Vitrine } from "./scenes/Vitrine";
import { Entrar } from "./scenes/Entrar";
import { Fecho } from "./scenes/Fecho";
import { CUES, velos } from "./theme";

/**
 * Vídeo de lançamento do Velos Wallet, 26 s a 30 fps, 1920×1080.
 * A sequência segue media/video-lancamento/ROTEIRO.md.
 */
export function Lancamento() {
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

  return (
    <AbsoluteFill style={{ backgroundColor: velos.deep }}>
      <Sequence from={CUES.abertura.from} durationInFrames={CUES.abertura.duration}>
        <Abertura />
      </Sequence>

      <Sequence from={CUES.icone.from} durationInFrames={CUES.icone.duration}>
        <ToqueIcone />
      </Sequence>

      <Sequence from={CUES.vitrine.from} durationInFrames={CUES.vitrine.duration}>
        <Vitrine />
      </Sequence>

      <Sequence from={CUES.entrar.from} durationInFrames={CUES.entrar.duration}>
        <Entrar />
      </Sequence>

      <Sequence from={CUES.fecho.from} durationInFrames={CUES.fecho.duration}>
        <Fecho />
      </Sequence>
    </AbsoluteFill>
  );
}
