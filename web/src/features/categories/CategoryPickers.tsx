import type { CSSProperties } from "react";
import { Check } from "lucide-react";
import { cn } from "cn";

import { CATEGORY_COLORS, CATEGORY_ICONS, categoryColorVar, type CategoryIconName } from "./catalog";

const focusRing = "outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

type ColorPickerProps = { value: string; onChange: (hex: string) => void; error?: string };

/**
 * RN10: as 12 cores da paleta em círculos de 44 px. A escolhida ganha anel e um "✓" (não só a
 * cor); cada botão diz o nome da cor ao leitor de tela, com aria-pressed.
 */
export function ColorPicker({ value, onChange, error }: ColorPickerProps) {
  return (
    <fieldset className="space-y-2" aria-describedby={error ? "color-error" : undefined}>
      <legend className="mb-2 text-sm font-medium">Cor</legend>
      <div className="grid grid-cols-6 justify-items-center gap-y-3">
        {CATEGORY_COLORS.map(({ hex, label }) => {
          const selected = hex === value;
          return (
            <button
              key={hex}
              type="button"
              aria-pressed={selected}
              aria-label={`Cor ${label}`}
              onClick={() => onChange(hex)}
              style={{ backgroundColor: categoryColorVar(hex) }}
              className={cn(
                "flex size-11 items-center justify-center rounded-full text-card",
                selected && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
                focusRing,
              )}
            >
              {selected ? <Check className="size-5" strokeWidth={3} aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>
      {error ? <FieldError id="color-error" message={error} /> : null}
    </fieldset>
  );
}

type IconPickerProps = { value: string; color: string; onChange: (icon: CategoryIconName) => void; error?: string };

/** RN10: os 30 ícones em grade de 6 colunas. O escolhido ganha borda grossa e a cor da categoria. */
export function IconPicker({ value, color, onChange, error }: IconPickerProps) {
  return (
    <fieldset className="space-y-2" aria-describedby={error ? "icon-error" : undefined}>
      <legend className="mb-2 text-sm font-medium">Ícone</legend>
      <div
        className="grid grid-cols-6 gap-2"
        style={{ "--category": categoryColorVar(color) } as CSSProperties}
      >
        {(Object.keys(CATEGORY_ICONS) as CategoryIconName[]).map((name) => {
          const { Icon, label } = CATEGORY_ICONS[name];
          const selected = name === value;
          return (
            <button
              key={name}
              type="button"
              aria-pressed={selected}
              aria-label={label}
              onClick={() => onChange(name)}
              className={cn(
                "flex aspect-square min-h-11 items-center justify-center rounded-xl bg-card",
                // Sem bg-muted no escolhido: os tons --category foram medidos (>= 3:1) contra o card.
                selected ? "border-2 border-ring text-(--category)" : "border border-input text-foreground hover:bg-muted",
                focusRing,
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
            </button>
          );
        })}
      </div>
      {error ? <FieldError id="icon-error" message={error} /> : null}
    </fieldset>
  );
}

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} role="alert" className="text-sm text-destructive">
      {message}
    </p>
  );
}
