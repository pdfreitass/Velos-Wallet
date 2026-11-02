import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "cn"

/**
 * Seletor do Velos sobre o Select do Base UI: o campo fechado é igual aos inputs (44 px, borda
 * `input`, anel de foco), e a lista abre num cartão do app, com opções de 44 px e marca de
 * selecionado. Substitui o <select> nativo, cuja lista era desenhada pelo sistema.
 */
const Select = SelectPrimitive.Root

/** Campo fechado de seletores (Select, DatePicker): igual aos inputs de 44 px. */
const fieldTriggerClass =
  "group/select flex h-11 w-full min-w-0 items-center gap-3 rounded-lg border border-input bg-transparent pr-3 pl-3 text-left text-base text-foreground transition-colors outline-none select-none hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-[popup-open]:border-ring aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:border-destructive/50"

/** Cartão que abre sob o campo (lista do Select, calendário do DatePicker). */
const fieldPopupClass =
  "origin-(--transform-origin) rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-[0_18px_40px_-16px_rgb(4_20_15/0.45)] outline-none transition-[transform,opacity] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 motion-reduce:transition-none"

function SelectTrigger({ className, children, ...props }: SelectPrimitive.Trigger.Props) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(fieldTriggerClass, className)}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon className="ml-auto shrink-0 text-muted-foreground">
        <ChevronDown
          className="size-5 transition-transform duration-200 group-data-[popup-open]/select:rotate-180 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("flex min-w-0 flex-1 items-center gap-3 truncate data-[placeholder]:text-muted-foreground", className)}
      {...props}
    />
  )
}

function SelectContent({ className, children, ...props }: SelectPrimitive.Popup.Props) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        sideOffset={6}
        alignItemWithTrigger={false}
        className="z-50 outline-none"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          className={cn(
            fieldPopupClass,
            "max-h-[min(var(--available-height),22rem)] w-max max-w-[min(var(--available-width),22rem)] min-w-(--anchor-width) overflow-y-auto overscroll-contain",
            className
          )}
          {...props}
        >
          {children}
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectItem({ className, children, ...props }: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "group/select-item relative flex min-h-11 cursor-default items-center gap-3 rounded-lg py-1.5 pr-9 pl-2 text-base outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-muted data-[selected]:font-medium",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex min-w-0 flex-1 items-center gap-3">{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2.5 flex items-center">
        <Check className="size-4 text-foreground" strokeWidth={2.5} aria-hidden="true" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

function SelectGroup(props: SelectPrimitive.Group.Props) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

function SelectGroupLabel({ className, ...props }: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-group-label"
      className={cn("px-2 pt-2.5 pb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase", className)}
      {...props}
    />
  )
}

function SelectSeparator({ className, ...props }: SelectPrimitive.Separator.Props) {
  return <SelectPrimitive.Separator data-slot="select-separator" className={cn("-mx-1.5 my-1.5 h-px bg-border", className)} {...props} />
}

/**
 * Ladrilho de ícone das opções (o mesmo da lista de contas), para o campo e a lista baterem. Na
 * opção destacada o fundo vira `background`: `muted` e `secondary` são a mesma cor.
 */
function SelectIconTile({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground group-data-[highlighted]/select-item:bg-background [&_svg]:size-4",
        className
      )}
    >
      {children}
    </span>
  )
}

export {
  fieldPopupClass,
  fieldTriggerClass,
  Select,
  SelectContent,
  SelectGroup,
  SelectGroupLabel,
  SelectIconTile,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
