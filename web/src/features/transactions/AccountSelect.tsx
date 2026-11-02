import type { Ref } from "react";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectIconTile, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ACCOUNT_TYPE_INFO, type Account } from "@/features/accounts/types";
import { formatCurrency } from "@/lib/utils/currency";

type AccountSelectProps = {
  id: string;
  label: string;
  accounts: Account[];
  /** "" = nenhuma conta escolhida (valor do formulário). */
  value: string;
  onChange: (accountId: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  selectRef?: Ref<HTMLButtonElement>;
};

/**
 * Conta da transação (Conta, De, Para). Cada opção mostra o ícone do tipo, o nome e o saldo atual,
 * como na tela de Contas; o campo fechado mostra o ícone e o nome. O `id` vai no gatilho, para o
 * foco no primeiro erro (form-focus) continuar funcionando.
 */
export function AccountSelect({ id, label, accounts, value, onChange, onBlur, error, placeholder, selectRef }: AccountSelectProps) {
  const labelId = `${id}-label`;
  const errorId = `${id}-error`;
  const byId = new Map(accounts.map((account) => [account.id, account]));

  return (
    <div className="space-y-2">
      <Label id={labelId} htmlFor={id}>
        {label}
      </Label>
      <Select value={value || null} onValueChange={(next) => onChange(typeof next === "string" ? next : "")}>
        <SelectTrigger
          id={id}
          ref={selectRef}
          onBlur={onBlur}
          aria-labelledby={labelId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        >
          <SelectValue placeholder={placeholder ?? "Escolha a conta"}>
            {(selected: string | null) => {
              const account = selected ? byId.get(selected) : undefined;
              return account ? <AccountLabel account={account} /> : (placeholder ?? "Escolha a conta");
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {accounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              <AccountLabel account={account} detailed />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Ícone + nome; na lista, também o tipo e o saldo (texto, sem depender de cor). */
function AccountLabel({ account, detailed = false }: { account: Account; detailed?: boolean }) {
  const { label, Icon } = ACCOUNT_TYPE_INFO[account.type];
  return (
    <>
      <SelectIconTile>
        <Icon />
      </SelectIconTile>
      <span className="min-w-0 flex-1">
        <span className="block truncate">{account.name}</span>
        {detailed ? (
          <span className="block truncate text-sm font-normal text-muted-foreground">
            {label} · <span className="tabular-nums">{formatCurrency(account.balanceCents)}</span>
          </span>
        ) : null}
      </span>
    </>
  );
}
