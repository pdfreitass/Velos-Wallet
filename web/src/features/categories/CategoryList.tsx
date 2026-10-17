import { ChevronRight, Plus, Tags } from "lucide-react";
import { Tabs } from "@base-ui/react/tabs";
import { Link, useSearchParams } from "react-router";
import { cn } from "cn";

import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { LoadError } from "@/components/shared/LoadError";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { categoryPath, ROUTES } from "@/lib/auth/routes";

import { useCategories } from "./api";
import { CATEGORY_TYPE_INFO, CATEGORY_TYPES, TYPE_PARAM, typeFromParam, typeToParam, type Category, type CategoryType } from "./types";

/**
 * Lista de /categorias (spec 002): abas Despesas e Receitas com a contagem, cada categoria com o
 * CategoryBadge (RN10). A aba fica no endereço (?tipo=receitas), para voltar a ela depois de salvar.
 */
export function CategoryList() {
  const categories = useCategories();
  const [params, setParams] = useSearchParams();
  const active = typeFromParam(params.get(TYPE_PARAM));

  if (categories.isPending) return <CategoryListSkeleton />;
  if (categories.isError) {
    return (
      <LoadError
        title="Não foi possível carregar suas categorias"
        message="Confira sua conexão e tente de novo em instantes."
        onRetry={() => void categories.refetch()}
        isRetrying={categories.isFetching}
      />
    );
  }

  const byType = (type: CategoryType) => categories.data.filter((c) => c.type === type);

  return (
    <Tabs.Root
      value={active}
      onValueChange={(value) => setParams({ [TYPE_PARAM]: typeToParam(value as CategoryType) }, { replace: true })}
    >
      <Tabs.List aria-label="Tipo de categoria" activateOnFocus className="mb-4 grid grid-cols-2 rounded-xl bg-secondary p-1">
        {CATEGORY_TYPES.map((type) => (
          <Tabs.Tab
            key={type}
            value={type}
            className="min-h-11 rounded-lg font-medium text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-selected:bg-card aria-selected:text-foreground aria-selected:shadow-sm"
          >
            {CATEGORY_TYPE_INFO[type].plural} · {byType(type).length}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {CATEGORY_TYPES.map((type) => (
        <Tabs.Panel key={type} value={type} className="outline-none">
          <CategoryPanel type={type} categories={byType(type)} />
        </Tabs.Panel>
      ))}
    </Tabs.Root>
  );
}

function CategoryPanel({ type, categories }: { type: CategoryType; categories: Category[] }) {
  if (categories.length === 0) return <EmptyCategories type={type} />;
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
      {categories.map((category) => (
        <li key={category.id}>
          <Link
            to={categoryPath(category.id)}
            className="flex min-h-14 items-center gap-3 px-4 py-2.5 text-card-foreground outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
          >
            <CategoryBadge name={category.name} color={category.color} icon={category.icon} className="flex-1 font-medium" />
            <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function EmptyCategories({ type }: { type: CategoryType }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <Tags className="size-6" aria-hidden="true" />
      </span>
      <h2 className="text-lg font-semibold">Nenhuma categoria de {CATEGORY_TYPE_INFO[type].lower}</h2>
      <Link
        to={`${ROUTES.newCategory}?${TYPE_PARAM}=${typeToParam(type)}`}
        className={cn(buttonVariants(), "mt-1 h-11 px-5 text-base")}
      >
        <Plus aria-hidden="true" />
        Adicionar
        <span className="sr-only"> categoria de {CATEGORY_TYPE_INFO[type].lower}</span>
      </Link>
    </div>
  );
}

function CategoryListSkeleton() {
  return (
    <div aria-busy="true" className="space-y-4">
      <span role="status" className="sr-only">
        Carregando suas categorias…
      </span>
      <Skeleton className="h-13 w-full rounded-xl" />
      <div className="divide-y divide-border rounded-xl border border-border bg-card">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex min-h-14 items-center gap-3 px-4 py-2.5">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
