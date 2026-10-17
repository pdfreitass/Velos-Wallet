import { Lock } from "lucide-react";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";

import { CATEGORY_TYPE_INFO, CATEGORY_TYPES, type CategoryType } from "./types";

/** Criação (RN8): Despesa ou Receita num seletor segmentado (rádios; setas trocam a opção). */
export function CategoryTypePicker({ value, onChange }: { value: CategoryType; onChange: (type: CategoryType) => void }) {
  return (
    <div className="space-y-2">
      <span id="category-type-label" className="text-sm font-medium">
        Tipo
      </span>
      <RadioGroup
        value={value}
        onValueChange={(next) => onChange(next as CategoryType)}
        aria-labelledby="category-type-label"
        aria-describedby="category-type-hint"
        className="grid grid-cols-2 rounded-xl bg-secondary p-1"
      >
        {CATEGORY_TYPES.map((type) => (
          <Radio.Root
            key={type}
            value={type}
            className="flex min-h-11 items-center justify-center rounded-lg font-medium text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-checked:bg-card data-checked:text-foreground data-checked:shadow-sm"
          >
            {CATEGORY_TYPE_INFO[type].label}
          </Radio.Root>
        ))}
      </RadioGroup>
      <p id="category-type-hint" className="text-sm text-muted-foreground">
        O tipo não pode ser trocado depois.
      </p>
    </div>
  );
}

/** Edição (RN8): o tipo aparece travado, com cadeado e o motivo. */
export function CategoryTypeLocked({ type }: { type: CategoryType }) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">Tipo</span>
      <div className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-card px-4 py-2">
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{CATEGORY_TYPE_INFO[type].label}</span>
          <span className="block text-sm text-muted-foreground">O tipo não muda depois de criada</span>
        </span>
        <Lock className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </div>
    </div>
  );
}
