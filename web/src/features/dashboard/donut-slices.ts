import type { DonutSlice } from "@/components/shared/CategoryDonut";
import { categoryColorVar } from "@/features/categories/catalog";

import type { CategorySpending } from "./api";

/** RN1 da spec 010: acima disto, as categorias menores juntam-se numa fatia "Outras". */
const MAX_OWN_SLICES = 5;

/** Cor neutra: a mesma que a lista já usa para "Sem categoria". */
const NEUTRAL = "var(--muted-foreground)";

/**
 * RN1 da spec 010: as 5 maiores viram fatia própria e o resto soma numa fatia "Outras", para a
 * rosca não virar um mosaico de fatias de 1%. Com 6 ou menos, cada categoria tem a sua.
 *
 * As categorias já chegam ordenadas da API (maior → menor). A porcentagem é **só para desenho**:
 * o dinheiro continua em centavos e a soma continua a vir do banco.
 *
 * Fica num arquivo próprio por duas razões: exportá-la junto do componente quebra o fast refresh,
 * e assim ela é pura e fica pronta para ganhar teste quando o front tiver suíte.
 */
export function toDonutSlices(categories: CategorySpending[], totalCents: number): DonutSlice[] {
  if (totalCents <= 0) return [];

  const share = (cents: number) => (cents * 100) / totalCents;
  const own = (item: CategorySpending): DonutSlice => ({
    key: item.categoryId ?? "none",
    // RN7: "Sem categoria" é uma categoria normal aqui, e não se confunde com "Outras".
    color: item.color ? categoryColorVar(item.color) : NEUTRAL,
    share: share(item.amountCents),
  });

  // Com exatamente uma categoria a mais que o limite, "Outras" teria uma fatia só: não compensa.
  if (categories.length <= MAX_OWN_SLICES + 1) return categories.map(own);

  const head = categories.slice(0, MAX_OWN_SLICES);
  const tailCents = categories.slice(MAX_OWN_SLICES).reduce((sum, item) => sum + item.amountCents, 0);

  return [
    ...head.map(own),
    // RN3: "Outras" não existe como categoria, então não entra na lista nem é clicável.
    { key: "others", color: NEUTRAL, share: share(tailCents) },
  ];
}
