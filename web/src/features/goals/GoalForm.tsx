import { useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useController, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { cn } from "cn";

import { FormAlert } from "@/components/shared/FormAlert";
import { FormField } from "@/components/shared/FormField";
import { MoneyInput } from "@/components/shared/MoneyInput";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { applyServerFieldErrors, toErrorAlert, type ErrorAlert } from "@/lib/api/errors";
import { goalPath, ROUTES } from "@/lib/auth/routes";
import { todayInSaoPaulo } from "@/lib/utils/date";
import { GOAL_NAME_MAX_LENGTH, goalFormSchema, type GoalFormInput, type GoalFormValues } from "@/lib/validations/goals";

import { useCreateGoal, useUpdateGoal } from "./api";
import { GoalDeadlineField } from "./GoalDeadlineField";
import type { Goal } from "./types";

const serverFields = ["name", "deadline"] as const;

/** Nova meta (sem `goal`) ou edição. RN2: na edição, o prazo gravado pode ficar como está. */
export function GoalForm({ goal, footer }: { goal?: Goal; footer?: ReactNode }) {
  const navigate = useNavigate();
  const create = useCreateGoal();
  const update = useUpdateGoal(goal?.id ?? "");
  const [alert, setAlert] = useState<ErrorAlert | null>(null);
  const isEdit = goal !== undefined;
  const isSaving = create.isPending || update.isPending;
  const today = todayInSaoPaulo();
  const currentDeadline = goal?.deadline ?? null;

  const { register, handleSubmit, setError, control, formState: { errors } } = useForm<
    GoalFormInput,
    unknown,
    GoalFormValues
  >({
    resolver: zodResolver(goalFormSchema(currentDeadline)),
    defaultValues: goal
      ? { name: goal.name, targetCents: goal.targetCents, deadline: goal.deadline ?? "" }
      : { name: "", targetCents: 0, deadline: "" },
    mode: "onTouched",
  });
  const target = useController({ control, name: "targetCents" });
  const deadline = useController({ control, name: "deadline" });

  const onSubmit = handleSubmit(async ({ name, targetCents, deadline: deadlineValue }) => {
    setAlert(null);
    const body = { name, targetCents, deadline: deadlineValue === "" ? null : deadlineValue };
    try {
      if (isEdit) {
        await update.mutateAsync(body);
        navigate(goalPath(goal.id));
      } else {
        const created = await create.mutateAsync(body);
        navigate(goalPath(created.id));
      }
    } catch (error) {
      const targetError = error instanceof ApiError ? error.fieldErrors.targetCents?.[0] : undefined;
      if (targetError) setError("targetCents", { type: "server", message: targetError }, { shouldFocus: true });
      if (!applyServerFieldErrors(error, serverFields, setError) && !targetError) setAlert(toErrorAlert(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {alert ? <FormAlert message={alert.message} /> : null}

      <FormField id="name" label="Nome da meta" error={errors.name?.message} describedBy="name-hint">
        {(field) => (
          <Input
            {...field}
            {...register("name")}
            autoComplete="off"
            maxLength={80}
            placeholder="Viagem para o Chile"
            className="h-11 text-base"
          />
        )}
      </FormField>
      <p id="name-hint" className="-mt-4 text-sm text-muted-foreground">
        Até {GOAL_NAME_MAX_LENGTH} caracteres.
      </p>

      <FormField id="targetCents" label="Quanto você quer juntar?" error={errors.targetCents?.message}>
        {(field) => (
          <MoneyInput
            {...field}
            name={target.field.name}
            value={target.field.value}
            onChange={target.field.onChange}
            onBlur={target.field.onBlur}
            ref={target.field.ref}
          />
        )}
      </FormField>

      <GoalDeadlineField
        value={deadline.field.value}
        onChange={deadline.field.onChange}
        onBlur={deadline.field.onBlur}
        inputRef={deadline.field.ref}
        min={today}
        today={today}
        error={errors.deadline?.message}
      />

      {footer}

      <div className="grid grid-cols-2 gap-3 pt-2">
        <Link
          to={isEdit ? goalPath(goal.id) : ROUTES.goals}
          className={cn(buttonVariants({ variant: "outline" }), "h-11 text-base")}
        >
          Cancelar
        </Link>
        <Button type="submit" className="h-11 text-base" disabled={isSaving}>
          {isSaving ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
          {isSaving ? "Salvando…" : isEdit ? "Salvar alterações" : "Criar meta"}
        </Button>
      </div>
    </form>
  );
}
