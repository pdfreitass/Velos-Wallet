import { cn } from "cn";

import { TRANSACTION_TYPE_INFO, TRANSACTION_TYPES, type TransactionType } from "./types";

type TransactionTypeTabsProps = {
  value: TransactionType;
  onChange: (type: TransactionType) => void;
  /** Na edição (RN8): transferência fica sozinha; despesa e receita não viram transferência. */
  isAllowed?: (type: TransactionType) => boolean;
};

/**
 * Despesa · Receita · Transferência. Botões com aria-pressed num grupo rotulado; o escolhido ganha
 * fundo, sombra e ícone (não só a cor). Os bloqueados ficam desabilitados, com o motivo no título.
 */
export function TransactionTypeTabs({ value, onChange, isAllowed = () => true }: TransactionTypeTabsProps) {
  return (
    <div role="group" aria-label="Tipo da transação" className="grid grid-cols-3 rounded-xl bg-secondary p-1">
      {TRANSACTION_TYPES.map((type) => {
        const { label, Icon } = TRANSACTION_TYPE_INFO[type];
        const selected = type === value;
        const allowed = isAllowed(type);
        return (
          <button
            key={type}
            type="button"
            aria-pressed={selected}
            disabled={!allowed}
            title={allowed ? undefined : "Para trocar entre transferência e despesa ou receita, exclua e lance de novo"}
            onClick={() => onChange(type)}
            className={cn(
              "flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-1 text-sm font-medium text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40 sm:text-base",
              selected && "bg-card text-foreground shadow-sm",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
