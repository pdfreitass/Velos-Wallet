import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { ptBR } from "react-day-picker/locale"
import { cn } from "cn"

import { formatMonthLabel } from "@/lib/utils/date"

/**
 * Calendário do Velos sobre o react-day-picker (teclado, ARIA e pt-BR prontos). Dias de 44 px
 * (alvo de toque), o dia escolhido em `primary`, hoje com contorno (não só cor) e os dias fora do
 * intervalo apagados e sem clique.
 */
function Calendar({ className, classNames, ...props }: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      locale={ptBR}
      showOutsideDays
      // "Outubro de 2026", igual ao seletor de mês do app.
      formatters={{ formatCaption: (month) => formatMonthLabel(month) }}
      className={cn("p-1.5", className)}
      classNames={{
        months: "relative flex flex-col",
        month: "space-y-2",
        month_caption: "flex h-11 items-center justify-center",
        caption_label: "text-base font-semibold first-letter:uppercase",
        nav: "absolute inset-x-0 top-0 z-10 flex h-11 items-center justify-between",
        button_previous: navButton,
        button_next: navButton,
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-11 pb-1 text-xs font-medium text-muted-foreground uppercase",
        week: "flex",
        day: "size-11 p-0 text-center",
        day_button:
          "size-11 rounded-lg text-base tabular-nums transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
        selected:
          "[&>button]:bg-primary [&>button]:font-semibold [&>button]:text-primary-foreground [&>button]:hover:bg-primary",
        today: "[&>button]:border [&>button]:border-input [&>button]:font-semibold",
        outside: "text-muted-foreground/60",
        disabled: "text-muted-foreground/40 [&>button]:pointer-events-none [&>button]:hover:bg-transparent",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="size-5" aria-hidden="true" />
          ) : (
            <ChevronRight className="size-5" aria-hidden="true" />
          ),
      }}
      {...props}
    />
  )
}

const navButton =
  "inline-flex size-11 items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40"

export { Calendar }
