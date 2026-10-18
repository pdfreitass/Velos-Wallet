import { useController, type Control, type FieldErrors } from "react-hook-form";

import type { Account } from "@/features/accounts/types";
import type { Category } from "@/features/categories/types";
import type { TransactionFormInput } from "@/lib/validations/transactions";

import { AccountSelect, CategoryGrid } from "./TransactionFields";
import { TRANSACTION_TYPE_INFO, type TransactionType } from "./types";

type TransactionPlaceFieldsProps = {
  type: TransactionType;
  control: Control<TransactionFormInput>;
  errors: FieldErrors<TransactionFormInput>;
  accounts: Account[];
  categories: Category[];
};

/**
 * "Onde" a transação acontece (RN1): despesa e receita têm categoria do tipo + conta; transferência
 * troca a categoria por "De" e "Para".
 */
export function TransactionPlaceFields({ type, control, errors, accounts, categories }: TransactionPlaceFieldsProps) {
  const account = useController({ control, name: "accountId" });
  const target = useController({ control, name: "transferAccountId" });
  const category = useController({ control, name: "categoryId" });

  const accountSelect = (label: string) => (
    <AccountSelect
      id="accountId"
      label={label}
      accounts={accounts}
      value={account.field.value}
      onChange={account.field.onChange}
      onBlur={account.field.onBlur}
      selectRef={account.field.ref}
      error={errors.accountId?.message}
      placeholder="Escolha a conta"
    />
  );

  if (type === "transfer") {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {accountSelect("De")}
        <AccountSelect
          id="transferAccountId"
          label="Para"
          accounts={accounts}
          value={target.field.value}
          onChange={target.field.onChange}
          onBlur={target.field.onBlur}
          selectRef={target.field.ref}
          error={errors.transferAccountId?.message}
          placeholder="Escolha a conta"
        />
      </div>
    );
  }

  return (
    <>
      <CategoryGrid
        legend={`Categoria de ${TRANSACTION_TYPE_INFO[type].lower}`}
        categories={categories.filter((c) => c.type === type)}
        value={category.field.value}
        onChange={category.field.onChange}
        error={errors.categoryId?.message}
      />
      {accountSelect("Conta")}
    </>
  );
}
