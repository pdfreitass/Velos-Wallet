import { useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useController, useForm, useWatch } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { cn } from "cn";

import { FormAlert } from "@/components/shared/FormAlert";
import { FormField } from "@/components/shared/FormField";
import { MoneyInput } from "@/components/shared/MoneyInput";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Account } from "@/features/accounts/types";
import type { Category } from "@/features/categories/types";
import { applyServerFieldErrors, toErrorAlert, type ErrorAlert } from "@/lib/api/errors";
import { ROUTES } from "@/lib/auth/routes";
import { todayInSaoPaulo } from "@/lib/utils/date";
import { lastUsed } from "@/lib/utils/last-used";
import {
  DESCRIPTION_MAX_LENGTH,
  MIN_TRANSACTION_DATE,
  transactionFormSchema,
  type TransactionFormInput,
  type TransactionFormValues,
} from "@/lib/validations/transactions";

import { useCreateTransaction, useUpdateTransaction } from "./api";
import { focusFirstError, TRANSACTION_FIELDS } from "./form-focus";
import { initialValues, suggestedCategory, toRequest } from "./form-values";
import { TransactionPlaceFields } from "./TransactionPlaceFields";
import { TransactionTypeTabs } from "./TransactionTypeTabs";
import { MONTH_PARAM, type TransactionDetail, type TransactionType } from "./types";

type TransactionFormProps = {
  accounts: Account[];
  categories: Category[];
  transaction?: TransactionDetail;
  footer?: ReactNode;
};

/**
 * Nova transação (sem `transaction`) ou edição. Pensado para os 3 toques (CA1): o valor abre com
 * foco, a conta e a última categoria já vêm escolhidas, e um toque na grade escolhe a categoria.
 * Na edição o tipo só troca entre despesa e receita (RN8), e a categoria é escolhida de novo.
 */
export function TransactionForm({ accounts, categories, transaction, footer }: TransactionFormProps) {
  const navigate = useNavigate();
  const create = useCreateTransaction();
  const update = useUpdateTransaction(transaction?.id ?? "");
  const [alert, setAlert] = useState<ErrorAlert | null>(null);
  const isEdit = transaction !== undefined;
  const isSaving = create.isPending || update.isPending;

  const { register, handleSubmit, setError, setValue, control, formState: { errors } } = useForm<
    TransactionFormInput,
    unknown,
    TransactionFormValues
  >({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: initialValues(accounts, categories, transaction),
    // Valida ao enviar e revalida ao digitar. Com "onTouched", sair do valor vazio mostrava o erro,
    // o layout descia e o toque em "Salvar" caía fora do botão (o envio se perdia).
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
  });
  const type = useWatch({ control, name: "type" });
  const amount = useController({ control, name: "amountCents" });

  function changeType(next: TransactionType) {
    if (next === type) return;
    setValue("type", next);
    setValue("categoryId", isEdit ? "" : suggestedCategory(next, categories));
  }

  const onSubmit = handleSubmit(async (values) => {
    setAlert(null);
    const body = toRequest(values);
    try {
      if (isEdit) await update.mutateAsync(body);
      else await create.mutateAsync(body);
      lastUsed.remember(body.accountId, body.type, body.categoryId);
      navigate(`${ROUTES.transactions}?${MONTH_PARAM}=${body.date.slice(0, 7)}`);
    } catch (error) {
      if (applyServerFieldErrors(error, TRANSACTION_FIELDS, setError)) focusFirstError(error);
      else setAlert(toErrorAlert(error));
    }
  }, focusFirstError);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {alert ? <FormAlert message={alert.message} /> : null}

      <TransactionTypeTabs
        value={type}
        onChange={changeType}
        isAllowed={(candidate) => !isEdit || (candidate === "transfer") === (transaction.type === "transfer")}
      />
      {errors.type ? <p role="alert" className="-mt-4 text-sm text-destructive">{errors.type.message}</p> : null}

      <FormField id="amountCents" label="Valor" error={errors.amountCents?.message}>
        {(field) => (
          <MoneyInput
            {...field}
            ref={amount.field.ref}
            name={amount.field.name}
            value={amount.field.value}
            onChange={amount.field.onChange}
            onBlur={amount.field.onBlur}
            autoFocus
            className="h-14 text-2xl font-semibold md:text-2xl"
          />
        )}
      </FormField>

      <TransactionPlaceFields type={type} control={control} errors={errors} accounts={accounts} categories={categories} />

      <FormField id="date" label="Data" error={errors.date?.message}>
        {(field) => (
          <Input
            {...field}
            {...register("date")}
            type="date"
            min={MIN_TRANSACTION_DATE}
            max={todayInSaoPaulo()}
            className="h-11 text-base"
          />
        )}
      </FormField>

      <FormField id="description" label="Descrição (opcional)" error={errors.description?.message}>
        {(field) => (
          <Input
            {...field}
            {...register("description")}
            autoComplete="off"
            maxLength={DESCRIPTION_MAX_LENGTH * 2}
            placeholder="Ex.: Mercado do bairro"
            className="h-11 text-base"
          />
        )}
      </FormField>

      {footer}

      <div className="grid grid-cols-2 gap-3 pt-2">
        <Link to={ROUTES.transactions} className={cn(buttonVariants({ variant: "outline" }), "h-11 text-base")}>
          Cancelar
        </Link>
        <Button type="submit" className="h-11 text-base" disabled={isSaving}>
          {isSaving ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
          {isSaving ? "Salvando…" : isEdit ? "Salvar alterações" : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
