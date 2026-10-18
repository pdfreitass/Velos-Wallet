import { ChevronDown } from "lucide-react";

import { Label } from "@/components/ui/label";
import { useCategories } from "@/features/categories/api";
import { CATEGORY_TYPE_INFO, CATEGORY_TYPES } from "@/features/categories/types";

type CategoryFilterProps = { value: string | null; onChange: (categoryId: string | null) => void };

/**
 * Filtro por categoria (CA8) num <select> nativo de 44 px: no celular abre o seletor do sistema.
 * As categorias vêm agrupadas por tipo. Enquanto carregam, só "Todas as categorias".
 */
export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  const categories = useCategories();
  const list = categories.data ?? [];

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="category-filter" className="sr-only">
        Filtrar por categoria
      </Label>
      <div className="relative">
        <select
          id="category-filter"
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value || null)}
          className="h-11 w-full appearance-none rounded-lg border border-input bg-card pr-10 pl-3 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Todas as categorias</option>
          {CATEGORY_TYPES.map((type) => {
            const ofType = list.filter((category) => category.type === type);
            if (ofType.length === 0) return null;
            return (
              <optgroup key={type} label={CATEGORY_TYPE_INFO[type].plural}>
                {ofType.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
