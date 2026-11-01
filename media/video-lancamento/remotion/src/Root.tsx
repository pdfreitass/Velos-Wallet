import { Composition } from "remotion";
import { Lancamento } from "./Lancamento";
import { DURATION, FPS } from "./theme";
import { Reels } from "./vertical/Reels";
import { DURACAO_V, FPS_V } from "./vertical/temaVertical";

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="Lancamento"
        component={Lancamento}
        durationInFrames={DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />

      {/* Reels e TikTok: mesma história, recomposta na vertical e com trilha. */}
      <Composition
        id="Reels"
        component={Reels}
        durationInFrames={DURACAO_V}
        fps={FPS_V}
        width={1080}
        height={1920}
      />
    </>
  );
}
