import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { MAX_PERCENT, MIN_PERCENT, PRESET_PERCENTS } from "./types";

type CutPickerProps = { value: number; onChange: (percent: number) => void };

/**
 * Os atalhos e o corte livre. Nada aqui vai à rede: mover o percentual recalcula em memória (CA6).
 *
 * O campo livre aceita 1 a 100 (RN7) e é preso pelo próprio `input[type=range]`, então não há
 * estado inválido para mostrar mensagem — o CA8 vale para o cálculo, que recusa fora da faixa.
 */
export function CutPicker({ value, onChange }: CutPickerProps) {
  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor="simulacao-corte">Cortando quanto?</Label>

      <div className="flex gap-2">
        {PRESET_PERCENTS.map((percent) => (
          <Button
            key={percent}
            type="button"
            variant={value === percent ? "default" : "outline"}
            className={cn("h-11 flex-1 text-base", value === percent && "font-semibold")}
            aria-pressed={value === percent}
            onClick={() => onChange(percent)}
          >
            {percent}%
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <input
          id="simulacao-corte"
          type="range"
          min={MIN_PERCENT}
          max={MAX_PERCENT}
          step={1}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
          aria-describedby="simulacao-corte-valor"
        />
        <output
          id="simulacao-corte-valor"
          htmlFor="simulacao-corte"
          className="w-14 shrink-0 text-right text-base font-semibold tabular-nums"
        >
          {value}%
        </output>
      </div>
    </div>
  );
}
