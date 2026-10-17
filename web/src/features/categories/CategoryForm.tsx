import { useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { cn } from "cn";

import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { FormAlert } from "@/components/shared/FormAlert";
import { FormField } from "@/components/shared/FormField";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applyServerFieldErrors, toErrorAlert, type ErrorAlert } from "@/lib/api/errors";
import { ROUTES } from "@/lib/auth/routes";
import {
  CATEGORY_NAME_MAX_LENGTH,
  categoryFormSchema,
  type CategoryFormInput,
  type CategoryFormValues,
} from "@/lib/validations/categories";

import { useCreateCategory, useUpdateCategory } from "./api";
import { ColorPicker, IconPicker } from "./CategoryPickers";
import { CategoryTypeLocked, CategoryTypePicker } from "./CategoryTypeField";
import { CATEGORY_TYPE_INFO, TYPE_PARAM, typeToParam, type Category, type CategoryType } from "./types";

const serverFields = ["name", "type", "color", "icon"] as const;

type CategoryFormProps = {
  /** Sem `category`: criação. Com: edição, com o tipo travado (RN8). */
  category?: Category;
  initialType?: CategoryType;
  footer?: ReactNode;
};

export function CategoryForm({ category, initialType = "expense", footer }: CategoryFormProps) {
  const navigate = useNavigate();
  const create = useCreateCategory();
  const update = useUpdateCategory(category?.id ?? "");
  const [alert, setAlert] = useState<ErrorAlert | null>(null);
  const isEdit = category !== undefined;
  const isSaving = create.isPending || update.isPending;

  const { register, handleSubmit, setError, control, formState: { errors } } = useForm<
    CategoryFormInput,
    unknown,
    CategoryFormValues
  >({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: category
      ? { type: category.type, name: category.name, color: category.color.toUpperCase(), icon: category.icon as CategoryFormInput["icon"] }
      : { type: initialType, name: "", color: "#E8833A", icon: "tag" },
    mode: "onTouched",
  });
  const [type, name, color, icon] = useWatch({ control, name: ["type", "name", "color", "icon"] });
  const backTo = `${ROUTES.categories}?${TYPE_PARAM}=${typeToParam(type)}`;

  const onSubmit = handleSubmit(async (values) => {
    setAlert(null);
    try {
      if (isEdit) await update.mutateAsync({ name: values.name, color: values.color, icon: values.icon });
      else await create.mutateAsync(values);
      navigate(`${ROUTES.categories}?${TYPE_PARAM}=${typeToParam(values.type)}`);
    } catch (error) {
      if (!applyServerFieldErrors(error, serverFields, setError)) setAlert(toErrorAlert(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {alert ? <FormAlert message={alert.message} /> : null}

      <div className="flex min-h-16 items-center rounded-xl border border-dashed border-border bg-card px-4 py-3">
        <CategoryBadge name={name.trim() || "Nome da categoria"} color={color} icon={icon} className="font-medium" />
        <span className="ml-auto pl-3 text-right text-sm text-muted-foreground">
          {CATEGORY_TYPE_INFO[type].label} · pré-visualização
        </span>
      </div>

      {isEdit ? (
        <CategoryTypeLocked type={category.type} />
      ) : (
        <Controller
          control={control}
          name="type"
          render={({ field }) => <CategoryTypePicker value={field.value} onChange={field.onChange} />}
        />
      )}

      <FormField id="name" label="Nome" error={errors.name?.message} describedBy="name-hint">
        {(field) => <Input {...field} {...register("name")} autoComplete="off" maxLength={60} className="h-11 text-base" />}
      </FormField>
      <p id="name-hint" className="-mt-4 text-sm text-muted-foreground">
        Até {CATEGORY_NAME_MAX_LENGTH} caracteres.
      </p>

      <Controller
        control={control}
        name="color"
        render={({ field }) => <ColorPicker value={field.value} onChange={field.onChange} error={errors.color?.message} />}
      />
      <Controller
        control={control}
        name="icon"
        render={({ field }) => (
          <IconPicker value={field.value} color={color} onChange={field.onChange} error={errors.icon?.message} />
        )}
      />

      {footer}

      <div className="grid grid-cols-2 gap-3 pt-2">
        <Link to={backTo} className={cn(buttonVariants({ variant: "outline" }), "h-11 text-base")}>
          Cancelar
        </Link>
        <Button type="submit" className="h-11 text-base" disabled={isSaving}>
          {isSaving ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
          {isSaving ? "Salvando…" : isEdit ? "Salvar alterações" : "Salvar categoria"}
        </Button>
      </div>
    </form>
  );
}
