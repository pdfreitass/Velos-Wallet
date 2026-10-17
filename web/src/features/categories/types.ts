/** RN8 da spec 002. Mesmos valores do enum da API (camelCase). Não muda depois de criada. */
export const CATEGORY_TYPES = ["expense", "income"] as const;
export type CategoryType = (typeof CATEGORY_TYPES)[number];

export type Category = {
  id: string;
  name: string;
  type: CategoryType;
  /** Hex canônico do catálogo (RN10); a tela pinta com o token do tema (catalog.ts). */
  color: string;
  /** Nome do ícone lucide do catálogo. */
  icon: string;
};

export type CategoryDeletionImpact = { transactionCount: number };

export const CATEGORY_TYPE_INFO: Record<CategoryType, { label: string; plural: string; lower: string }> = {
  expense: { label: "Despesa", plural: "Despesas", lower: "despesa" },
  income: { label: "Receita", plural: "Receitas", lower: "receita" },
};

/** "?tipo=receitas" escolhe a aba (e o tipo inicial do formulário); qualquer outra coisa é despesa. */
export const TYPE_PARAM = "tipo";
export const typeFromParam = (value: string | null): CategoryType => (value === "receitas" ? "income" : "expense");
export const typeToParam = (type: CategoryType) => (type === "income" ? "receitas" : "despesas");
