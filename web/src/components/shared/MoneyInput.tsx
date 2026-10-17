import type { ChangeEvent, ComponentProps, FocusEvent } from "react";
import { cn } from "cn";

import { Input } from "@/components/ui/input";
import { formatCurrencyInput, nextMoneyInputCents } from "@/lib/utils/currency";

type MoneyInputProps = Omit<ComponentProps<"input">, "value" | "onChange" | "type" | "inputMode"> & {
  /** Valor em centavos inteiros, sempre positivo (o sinal vem do tipo ou de uma opção da tela). */
  value: number;
  onChange: (cents: number) => void;
};

/**
 * Campo de valor em reais: os dígitos entram pela direita ("0,00" -> "0,01" -> "0,12"), só
 * números, teto de R$ 999.999.999,99. Trabalha em centavos do começo ao fim (nunca parseFloat).
 * Funciona com o Controller do React Hook Form: `value`, `onChange`, `onBlur`, `name` e `ref`.
 */
export function MoneyInput({ value, onChange, onFocus, className, ...props }: MoneyInputProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(nextMoneyInputCents(event.target.value, value));
  }

  // O valor cresce pela direita: o cursor fica sempre no fim.
  function handleFocus(event: FocusEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    requestAnimationFrame(() => input.setSelectionRange(input.value.length, input.value.length));
    onFocus?.(event);
  }

  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-base text-muted-foreground"
      >
        R$
      </span>
      <Input
        {...props}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={formatCurrencyInput(value)}
        onChange={handleChange}
        onFocus={handleFocus}
        className={cn("h-11 pl-10 text-base tabular-nums", className)}
      />
    </div>
  );
}
