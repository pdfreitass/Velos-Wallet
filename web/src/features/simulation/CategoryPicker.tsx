import { CategoryIcon } from "@/components/shared/CategoryBadge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils/currency";

import { categoryKey, type CategoryAverage } from "./types";

type CategoryPickerProps = {
  categories: CategoryAverage[];
  value: CategoryAverage;
  onChange: (category: CategoryAverage) => void;
};

/**
 * RN2: quem escolhe a categoria é o usuário. A lista vem ordenada por valor porque isso é útil,
 * mas nenhuma categoria é marcada como cortável — "Moradia" e "Lazer" têm o mesmo tratamento.
 */
export function CategoryPicker({ categories, value, onChange }: CategoryPickerProps) {
  const byKey = new Map(categories.map((category) => [categoryKey(category), category]));

  return (
    <div className="flex flex-col gap-1.5">
      <Label id="simulacao-categoria-label" htmlFor="simulacao-categoria">
        Em qual categoria?
      </Label>
      <Select
        value={categoryKey(value)}
        onValueChange={(next) => {
          const chosen = next ? byKey.get(String(next)) : undefined;
          if (chosen) onChange(chosen);
        }}
      >
        <SelectTrigger
          id="simulacao-categoria"
          aria-labelledby="simulacao-categoria-label"
          className="h-auto min-h-14 bg-card dark:bg-card"
        >
          <SelectValue>
            {(selected: string | null) => {
              const category = selected ? byKey.get(String(selected)) : undefined;
              return <CategoryOption category={category ?? value} />;
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={categoryKey(category)} value={categoryKey(category)}>
              <CategoryOption category={category} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** RN9: "Sem categoria" aparece com o mesmo rótulo e o mesmo círculo "?" do Início. */
function CategoryOption({ category }: { category: CategoryAverage }) {
  return (
    <>
      {category.icon && category.color ? (
        <CategoryIcon color={category.color} icon={category.icon} />
      ) : (
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm text-secondary-foreground"
        >
          ?
        </span>
      )}
      <span className="flex min-w-0 flex-col items-start">
        <span className="truncate">{category.name ?? "Sem categoria"}</span>
        <span className="text-xs text-muted-foreground">{formatCurrency(category.averageCents)} por mês</span>
      </span>
    </>
  );
}
