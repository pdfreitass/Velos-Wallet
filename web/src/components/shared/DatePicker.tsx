import { useState, type Ref } from "react";
import { Popover } from "@base-ui/react/popover";
import { subDays } from "date-fns";
import { CalendarDays, ChevronDown } from "lucide-react";
import { cn } from "cn";

import { Calendar } from "@/components/ui/calendar";
import { fieldPopupClass, fieldTriggerClass, SelectIconTile } from "@/components/ui/select";
import { formatDayHeading, parseDbDate, toDbDate } from "@/lib/utils/date";

type DatePickerProps = {
  id: string;
  /** "yyyy-MM-dd" (ou "" sem data). */
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  /** "yyyy-MM-dd", inclusivo. */
  min?: string;
  max?: string;
  /** "Hoje" de referência (São Paulo), para o rótulo e os atalhos. */
  today: string;
  invalid?: boolean;
  describedBy?: string;
  ref?: Ref<HTMLButtonElement>;
};

/**
 * Campo de data no padrão do app: o campo fechado é igual aos seletores e mostra "Hoje", "Ontem"
 * ou "Sexta, 10 de outubro" (como os cabeçalhos da lista); o calendário abre num cartão, com
 * atalhos para hoje e ontem. Datas fora de `min`/`max` ficam bloqueadas.
 */
export function DatePicker({ id, value, onChange, onBlur, min, max, today, invalid, describedBy, ref }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseDbDate(value) : undefined;
  const yesterday = toDbDate(subDays(parseDbDate(today), 1));

  function choose(next: string) {
    onChange(next);
    setOpen(false);
  }

  const shortcuts = [
    { label: "Hoje", value: today },
    { label: "Ontem", value: yesterday },
  ].filter((shortcut) => (!min || shortcut.value >= min) && (!max || shortcut.value <= max));

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        id={id}
        ref={ref}
        onBlur={onBlur}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={fieldTriggerClass}
      >
        <SelectIconTile>
          <CalendarDays />
        </SelectIconTile>
        <span className={cn("flex-1 truncate", !value && "text-muted-foreground")}>
          {value ? dateLabel(value, today) : "Escolha a data"}
        </span>
        <ChevronDown
          className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[popup-open]/select:rotate-180 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={6} align="start" className="z-50 outline-none">
          <Popover.Popup aria-label="Escolher data" className={fieldPopupClass}>
            <Calendar
              mode="single"
              autoFocus
              selected={selected}
              defaultMonth={selected ?? parseDbDate(today)}
              startMonth={min ? parseDbDate(min) : undefined}
              endMonth={max ? parseDbDate(max) : undefined}
              disabled={[
                ...(min ? [{ before: parseDbDate(min) }] : []),
                ...(max ? [{ after: parseDbDate(max) }] : []),
              ]}
              onSelect={(date) => date && choose(toDbDate(date))}
            />
            {shortcuts.length > 0 ? (
              <div className="mt-1 flex gap-2 border-t border-border px-1.5 pt-2 pb-0.5">
                {shortcuts.map((shortcut) => (
                  <button
                    key={shortcut.label}
                    type="button"
                    onClick={() => choose(shortcut.value)}
                    aria-pressed={value === shortcut.value}
                    className="h-11 flex-1 rounded-lg border border-input text-sm font-medium transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:border-primary aria-pressed:bg-secondary"
                  >
                    {shortcut.label}
                  </button>
                ))}
              </div>
            ) : null}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

/** "Hoje" / "Ontem" / "Sexta, 10 de outubro", com o ano quando não é o ano corrente. */
function dateLabel(value: string, today: string): string {
  const label = formatDayHeading(value, today);
  return value.slice(0, 4) === today.slice(0, 4) ? label : `${label} de ${value.slice(0, 4)}`;
}
