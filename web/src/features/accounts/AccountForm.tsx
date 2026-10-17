import { useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { Controller, useController, useForm, useWatch } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { cn } from "cn";

import { FormAlert } from "@/components/shared/FormAlert";
import { FormField } from "@/components/shared/FormField";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { applyServerFieldErrors, toErrorAlert, type ErrorAlert } from "@/lib/api/errors";
import { ROUTES } from "@/lib/auth/routes";
import {
  ACCOUNT_NAME_MAX_LENGTH,
  accountFormSchema,
  type AccountFormInput,
  type AccountFormValues,
} from "@/lib/validations/accounts";

import { AccountAmountField } from "./AccountAmountField";
import { AccountTypeLocked, AccountTypePicker } from "./AccountTypeField";
import { useCreateAccount, useUpdateAccount } from "./api";
import { fromSignedCents, toSignedCents, type Account } from "./types";

const serverFields = ["name", "type"] as const;

/** Nova conta (sem `account`) ou edição. Na edição o tipo fica travado (RN1). */
export function AccountForm({ account, footer }: { account?: Account; footer?: ReactNode }) {
  const navigate = useNavigate();
  const create = useCreateAccount();
  const update = useUpdateAccount(account?.id ?? "");
  const [alert, setAlert] = useState<ErrorAlert | null>(null);
  const isEdit = account !== undefined;
  const isSaving = create.isPending || update.isPending;

  const { register, handleSubmit, setError, control, formState: { errors } } = useForm<
    AccountFormInput,
    unknown,
    AccountFormValues
  >({
    resolver: zodResolver(accountFormSchema),
    defaultValues: account
      ? { type: account.type, name: account.name, ...fromSignedCents(account.type, account.initialBalanceCents) }
      : { name: "", amountCents: 0, overdraft: false },
    mode: "onTouched",
  });
  const type = useWatch({ control, name: "type" });
  const amount = useController({ control, name: "amountCents" });
  const overdraft = useController({ control, name: "overdraft" });

  const onSubmit = handleSubmit(async ({ type: accountType, name, amountCents, overdraft }) => {
    setAlert(null);
    const initialBalanceCents = toSignedCents(accountType, amountCents, overdraft);
    try {
      if (isEdit) await update.mutateAsync({ name, initialBalanceCents });
      else await create.mutateAsync({ name, type: accountType, initialBalanceCents });
      navigate(ROUTES.accounts);
    } catch (error) {
      const amountError = error instanceof ApiError ? error.fieldErrors.initialBalanceCents?.[0] : undefined;
      if (amountError) setError("amountCents", { type: "server", message: amountError }, { shouldFocus: true });
      if (!applyServerFieldErrors(error, serverFields, setError) && !amountError) setAlert(toErrorAlert(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {alert ? <FormAlert message={alert.message} /> : null}

      {isEdit ? (
        <AccountTypeLocked type={account.type} />
      ) : (
        <Controller
          control={control}
          name="type"
          render={({ field }) => <AccountTypePicker value={field.value} onChange={field.onChange} error={errors.type?.message} />}
        />
      )}

      <FormField id="name" label="Nome" error={errors.name?.message} describedBy="name-hint">
        {(field) => (
          <Input {...field} {...register("name")} autoComplete="off" maxLength={80} className="h-11 text-base" />
        )}
      </FormField>
      <p id="name-hint" className="-mt-4 text-sm text-muted-foreground">
        Até {ACCOUNT_NAME_MAX_LENGTH} caracteres.
      </p>

      <AccountAmountField
        type={type}
        amountCents={amount.field.value}
        onAmountChange={amount.field.onChange}
        inputRef={amount.field.ref}
        onBlur={amount.field.onBlur}
        overdraft={overdraft.field.value}
        onOverdraftChange={overdraft.field.onChange}
        error={errors.amountCents?.message}
      />

      {footer}

      <div className="grid grid-cols-2 gap-3 pt-2">
        <Link to={ROUTES.accounts} className={cn(buttonVariants({ variant: "outline" }), "h-11 text-base")}>
          Cancelar
        </Link>
        <Button type="submit" className="h-11 text-base" disabled={isSaving}>
          {isSaving ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
          {isSaving ? "Salvando…" : isEdit ? "Salvar alterações" : "Salvar conta"}
        </Button>
      </div>
    </form>
  );
}
