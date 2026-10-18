import type { CSSProperties, Ref } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Link } from "react-router";
import { cn } from "cn";

import { Label } from "@/components/ui/label";
import type { Account } from "@/features/accounts/types";
import { categoryColorVar, categoryIcon } from "@/features/categories/catalog";
import type { Category } from "@/features/categories/types";
import { ROUTES } from "@/lib/auth/routes";

const focusRing = "outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

type CategoryGridProps = {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
  error?: string;
  legend: string;
};

/**
 * Categorias do tipo escolhido em grade (um toque escolhe, CA1). A escolhida ganha borda grossa e
 * um "✓" (não só a cor), com aria-pressed. Cada botão tem pelo menos 44 px.
 */
export function CategoryGrid({ categories, value, onChange, error, legend }: CategoryGridProps) {
  return (
    <fieldset aria-describedby={error ? "categoryId-error" : undefined}>
      <legend className="mb-2 text-sm font-medium">{legend}</legend>
      {categories.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Nenhuma categoria deste tipo.{" "}
          <Link to={ROUTES.newCategory} className="font-medium text-foreground underline underline-offset-4">
            Criar categoria
          </Link>
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {categories.map((category) => {
            const Icon = categoryIcon(category.icon);
            const selected = category.id === value;
            return (
              <button
                key={category.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(category.id)}
                style={{ "--category": categoryColorVar(category.color) } as CSSProperties}
                className={cn(
                  "relative flex min-h-19 flex-col items-center justify-center gap-1.5 rounded-xl bg-card px-1 py-2 text-center text-xs font-medium",
                  selected ? "border-2 border-ring" : "border border-input hover:bg-muted",
                  focusRing,
                )}
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--category)_15%,transparent)] text-(--category)">
                  <Icon className="size-4.5" aria-hidden="true" />
                </span>
                <span className="line-clamp-2 text-foreground">{category.name}</span>
                {selected ? (
                  <Check className="absolute top-1.5 right-1.5 size-3.5 text-foreground" strokeWidth={3} aria-hidden="true" />
                ) : null}
              </button>
            );
          })}
        </div>
      )}
      {error ? (
        <p id="categoryId-error" role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

type AccountSelectProps = {
  id: string;
  label: string;
  accounts: Account[];
  value: string;
  onChange: (accountId: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  selectRef?: Ref<HTMLSelectElement>;
};

/** Conta num <select> nativo de 44 px (no celular abre o seletor do sistema). */
export function AccountSelect({ id, label, accounts, value, onChange, onBlur, error, placeholder, selectRef }: AccountSelectProps) {
  const errorId = `${id}-error`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <select
          id={id}
          ref={selectRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="h-11 w-full appearance-none rounded-lg border border-input bg-transparent pr-10 pl-3 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
