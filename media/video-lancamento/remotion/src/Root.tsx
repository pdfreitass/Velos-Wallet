import { Composition } from "remotion";
import { Lancamento } from "./Lancamento";
import { DURATION, FPS } from "./theme";

export function RemotionRoot() {
  return (
    <Composition
      id="Lancamento"
      component={Lancamento}
      durationInFrames={DURATION}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
}
