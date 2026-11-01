import { X } from "lucide-react";

import { DatePicker } from "@/components/shared/DatePicker";
import { FormField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { MAX_GOAL_DEADLINE } from "@/lib/validations/goals";

type GoalDeadlineFieldProps = {
  /** "yyyy-MM-dd" ou "" (sem prazo). */
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  inputRef: React.Ref<HTMLButtonElement>;
  /** Primeira data escolhível: hoje, ou o prazo já gravado se ele venceu (RN2). */
  min: string;
  today: string;
  error?: string;
};

/** Prazo da meta: opcional, com o botão "Sem prazo" para limpar o que já foi escolhido. */
export function GoalDeadlineField({ value, onChange, onBlur, inputRef, min, today, error }: GoalDeadlineFieldProps) {
  return (
    <>
      <FormField id="deadline" label="Prazo (opcional)" error={error} describedBy="deadline-hint">
        {(field) => (
          <div className="flex gap-2">
            <div className="min-w-0 flex-1">
              <DatePicker
                id={field.id}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                ref={inputRef}
                min={min}
                max={MAX_GOAL_DEADLINE}
                today={today}
                invalid={field["aria-invalid"]}
                describedBy={field["aria-describedby"]}
              />
            </div>
            {value !== "" ? (
              <Button type="button" variant="outline" className="h-11 shrink-0 px-3" onClick={() => onChange("")}>
                <X aria-hidden="true" />
                Sem prazo
              </Button>
            ) : null}
          </div>
        )}
      </FormField>
      <p id="deadline-hint" className="-mt-4 text-sm text-muted-foreground">
        Com um prazo, mostramos quanto guardar por mês para chegar lá.
      </p>
    </>
  );
}
