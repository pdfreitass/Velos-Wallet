import type { Ref } from "react";
import { cn } from "cn";

import { FormField } from "@/components/shared/FormField";
import { MoneyInput } from "@/components/shared/MoneyInput";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/lib/utils/currency";

import { ACCOUNT_TYPE_INFO, toSignedCents, type AccountType } from "./types";

type AccountAmountFieldProps = {
  type: AccountType | undefined;
  amountCents: number;
  onAmountChange: (cents: number) => void;
  /** Do React Hook Form: o foco vai para o campo quando a API recusa o valor. */
  inputRef: Ref<HTMLInputElement>;
  onBlur: () => void;
  overdraft: boolean;
  onOverdraftChange: (checked: boolean) => void;
  error?: string;
};

/**
 * Saldo inicial (RN3): a pergunta muda por tipo, a opção de cheque especial só existe na conta
 * corrente, e uma prévia mostra como o valor vai aparecer na lista (com sinal, não só cor).
 */
export function AccountAmountField({
  type,
  amountCents,
  onAmountChange,
  inputRef,
  onBlur,
  overdraft,
  onOverdraftChange,
  error,
}: AccountAmountFieldProps) {
  const label = type ? ACCOUNT_TYPE_INFO[type].amountLabel : "Quanto tem nesta conta hoje?";
  const signed = type ? toSignedCents(type, amountCents, overdraft) : amountCents;

  return (
    <div className="space-y-3">
      <FormField id="amountCents" label={label} error={error} describedBy="amount-preview">
        {(field) => (
          <MoneyInput
            {...field}
            ref={inputRef}
            name="amountCents"
            value={amountCents}
            onChange={onAmountChange}
            onBlur={onBlur}
          />
        )}
      </FormField>

      {type === "checking" ? (
        <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl bg-secondary px-3 text-secondary-foreground">
          <Checkbox checked={overdraft} onCheckedChange={(checked) => onOverdraftChange(checked)} />
          Estou no negativo (cheque especial)
        </label>
      ) : null}

      <p id="amount-preview" className="text-sm text-muted-foreground">
        Vai aparecer como{" "}
        <strong className={cn("font-semibold text-foreground tabular-nums", signed < 0 && "text-expense")}>
          {formatCurrency(signed)}
        </strong>
        {type === "creditCard" ? ", com o rótulo “Fatura atual”." : " na lista."}
      </p>
    </div>
  );
}
