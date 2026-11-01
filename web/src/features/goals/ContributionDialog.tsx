import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useController, useForm } from "react-hook-form";

import { DatePicker } from "@/components/shared/DatePicker";
import { FormAlert } from "@/components/shared/FormAlert";
import { FormField } from "@/components/shared/FormField";
import { MoneyInput } from "@/components/shared/MoneyInput";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiError } from "@/lib/api/client";
import { applyServerFieldErrors, toErrorAlert, type ErrorAlert } from "@/lib/api/errors";
import { todayInSaoPaulo } from "@/lib/utils/date";
import { MIN_TRANSACTION_DATE } from "@/lib/validations/transactions";
import {
  contributionFormSchema,
  type ContributionFormInput,
  type ContributionFormValues,
} from "@/lib/validations/goals";

import { useAddContribution, useUpdateContribution } from "./api";
import type { Contribution } from "./types";

type ContributionDialogProps = {
  goalId: string;
  /** Com um aporte, o diálogo edita; sem ele, registra um novo. */
  contribution?: Contribution;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Registrar ou corrigir um aporte (RN3): valor e data, com hoje como padrão. O aporte não mexe em
 * saldo nenhum (CA7), então nada de dinheiro é invalidado além de `["goals"]`.
 *
 * Quem abre monta o diálogo só quando `open` é verdadeiro: cada abertura é um formulário novo, sem
 * precisar reiniciar os campos à mão.
 */
export function ContributionDialog({ goalId, contribution, open, onOpenChange }: ContributionDialogProps) {
  const today = todayInSaoPaulo();
  const isEdit = contribution !== undefined;
  const add = useAddContribution(goalId);
  const update = useUpdateContribution(goalId, contribution?.id ?? "");
  const [alert, setAlert] = useState<ErrorAlert | null>(null);
  const isSaving = add.isPending || update.isPending;

  const { handleSubmit, setError, control, formState: { errors } } = useForm<
    ContributionFormInput,
    unknown,
    ContributionFormValues
  >({
    resolver: zodResolver(contributionFormSchema),
    defaultValues: { amountCents: contribution?.amountCents ?? 0, date: contribution?.date ?? today },
    mode: "onTouched",
  });
  const amount = useController({ control, name: "amountCents" });
  const date = useController({ control, name: "date" });

  const onSubmit = handleSubmit(async (values) => {
    setAlert(null);
    try {
      if (isEdit) await update.mutateAsync(values);
      else await add.mutateAsync(values);
      onOpenChange(false);
    } catch (error) {
      const amountError = error instanceof ApiError ? error.fieldErrors.amountCents?.[0] : undefined;
      if (amountError) setError("amountCents", { type: "server", message: amountError }, { shouldFocus: true });
      if (!applyServerFieldErrors(error, ["date"] as const, setError) && !amountError) setAlert(toErrorAlert(error));
    }
  });

  return (
    // Enquanto salva, Esc e o clique no fundo nao fecham: o Cancelar ja fica desabilitado.
    <Dialog open={open} onOpenChange={(next) => !isSaving && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Corrigir aporte" : "Novo aporte"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Mude o valor ou a data do que você guardou." : "Quanto você guardou e quando."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="grid gap-4">
          {alert ? <FormAlert message={alert.message} /> : null}

          <FormField id="amountCents" label="Quanto você guardou?" error={errors.amountCents?.message}>
            {(field) => (
              <MoneyInput
                {...field}
                name={amount.field.name}
                value={amount.field.value}
                onChange={amount.field.onChange}
                onBlur={amount.field.onBlur}
                ref={amount.field.ref}
                autoFocus
              />
            )}
          </FormField>

          <FormField id="date" label="Quando" error={errors.date?.message}>
            {(field) => (
              <DatePicker
                id={field.id}
                value={date.field.value}
                onChange={date.field.onChange}
                onBlur={date.field.onBlur}
                ref={date.field.ref}
                min={MIN_TRANSACTION_DATE}
                max={today}
                today={today}
                invalid={field["aria-invalid"]}
                describedBy={field["aria-describedby"]}
              />
            )}
          </FormField>

          <DialogFooter>
            <Button type="submit" className="h-11 text-base" disabled={isSaving}>
              {isSaving ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
              {isSaving ? "Salvando…" : isEdit ? "Salvar alterações" : "Registrar aporte"}
            </Button>
            <DialogClose className="h-11 text-base" disabled={isSaving}>
              Cancelar
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
