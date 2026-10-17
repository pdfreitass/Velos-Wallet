import { Lock } from "lucide-react";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";

import { ACCOUNT_TYPE_INFO, ACCOUNT_TYPES, type AccountType } from "./types";

type AccountTypePickerProps = {
  value: AccountType | undefined;
  onChange: (type: AccountType) => void;
  error?: string;
};

/**
 * Criação (RN1): os 4 tipos como botões de rádio em grade 2×2 (mockup aprovado). O selecionado
 * ganha borda grossa e fundo, além da cor. Setas do teclado trocam a opção (Base UI).
 */
export function AccountTypePicker({ value, onChange, error }: AccountTypePickerProps) {
  return (
    <div className="space-y-2">
      <span id="account-type-label" className="text-sm font-medium">
        Tipo
      </span>
      <RadioGroup
        value={value ?? null}
        onValueChange={(next) => onChange(next as AccountType)}
        aria-labelledby="account-type-label"
        aria-describedby={error ? "account-type-error account-type-hint" : "account-type-hint"}
        aria-invalid={Boolean(error)}
        className="grid grid-cols-2 gap-2"
      >
        {ACCOUNT_TYPES.map((type) => {
          const { label, Icon } = ACCOUNT_TYPE_INFO[type];
          return (
            <Radio.Root
              key={type}
              value={type}
              className="flex min-h-14 items-center gap-2.5 rounded-xl border border-input bg-card px-3 text-left text-sm font-medium outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 data-checked:border-2 data-checked:border-ring data-checked:bg-muted data-checked:px-[11px]"
            >
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              {label}
            </Radio.Root>
          );
        })}
      </RadioGroup>
      {error ? (
        <p id="account-type-error" role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <p id="account-type-hint" className="text-sm text-muted-foreground">
        O tipo não pode ser trocado depois.
      </p>
    </div>
  );
}

/** Edição (RN1): o tipo aparece travado, com cadeado e o motivo. */
export function AccountTypeLocked({ type }: { type: AccountType }) {
  const { label, Icon } = ACCOUNT_TYPE_INFO[type];
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">Tipo</span>
      <div className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-card px-3 py-2">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{label}</span>
          <span className="block text-sm text-muted-foreground">O tipo não muda depois de criada</span>
        </span>
        <Lock className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </div>
    </div>
  );
}
