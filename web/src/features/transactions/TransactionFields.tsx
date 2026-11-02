import type { CSSProperties } from "react";
import { Check } from "lucide-react";
import { Link } from "react-router";
import { cn } from "cn";

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
