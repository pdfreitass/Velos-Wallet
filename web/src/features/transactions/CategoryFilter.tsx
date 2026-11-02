import { LayoutGrid } from "lucide-react";

import { CategoryIcon } from "@/components/shared/CategoryBadge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectGroupLabel,
  SelectIconTile,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/features/categories/api";
import { CATEGORY_TYPE_INFO, CATEGORY_TYPES, type Category } from "@/features/categories/types";

type CategoryFilterProps = { value: string | null; onChange: (categoryId: string | null) => void };

/** "Todas" é uma opção de verdade na lista (o Select reserva o `null` para "nada escolhido"). */
const ALL = "all";

/**
 * Filtro por categoria (CA8). As categorias vêm agrupadas por tipo, com o ícone e a cor delas; o
 * campo fechado mostra a categoria escolhida do mesmo jeito. Enquanto carregam, só "Todas".
 */
export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  const categories = useCategories();
  const list = categories.data ?? [];
  const byId = new Map(list.map((category) => [category.id, category]));

  return (
    <div className="flex flex-col gap-1.5">
      <Label id="category-filter-label" htmlFor="category-filter" className="sr-only">
        Filtrar por categoria
      </Label>
      <Select value={value ?? ALL} onValueChange={(next) => onChange(next && next !== ALL ? String(next) : null)}>
        <SelectTrigger id="category-filter" aria-labelledby="category-filter-label" className="bg-card dark:bg-card">
          <SelectValue>
            {(selected: string | null) => {
              const category = selected && selected !== ALL ? byId.get(selected) : undefined;
              return category ? <CategoryOption category={category} /> : <AllOption />;
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>
            <AllOption />
          </SelectItem>
          {CATEGORY_TYPES.map((type) => {
            const ofType = list.filter((category) => category.type === type);
            if (ofType.length === 0) return null;
            return (
              <SelectGroup key={type}>
                <SelectSeparator />
                <SelectGroupLabel>{CATEGORY_TYPE_INFO[type].plural}</SelectGroupLabel>
                {ofType.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <CategoryOption category={category} />
                  </SelectItem>
                ))}
              </SelectGroup>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

function AllOption() {
  return (
    <>
      <SelectIconTile className="size-9 rounded-full">
        <LayoutGrid />
      </SelectIconTile>
      <span className="truncate">Todas as categorias</span>
    </>
  );
}

function CategoryOption({ category }: { category: Category }) {
  return (
    <>
      <CategoryIcon color={category.color} icon={category.icon} />
      <span className="truncate">{category.name}</span>
    </>
  );
}
