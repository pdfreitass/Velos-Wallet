import { Plus } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { cn } from "cn";

import { buttonVariants } from "@/components/ui/button";
import { CategoryList } from "@/features/categories/CategoryList";
import { TYPE_PARAM } from "@/features/categories/types";
import { ROUTES } from "@/lib/auth/routes";

/** /categorias (spec 002, T12). "Adicionar" já abre no tipo da aba atual. */
export function CategoriesPage() {
  const [params] = useSearchParams();
  const tab = params.get(TYPE_PARAM);
  const newHref = tab ? `${ROUTES.newCategory}?${TYPE_PARAM}=${tab}` : ROUTES.newCategory;

  return (
    <div className="mx-auto max-w-2xl lg:mx-0">
      <title>Categorias · Velos Wallet</title>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Categorias</h1>
        <Link to={newHref} className={cn(buttonVariants(), "h-11 px-4 text-base")}>
          <Plus aria-hidden="true" />
          Adicionar
          <span className="sr-only"> categoria</span>
        </Link>
      </div>
      <CategoryList />
    </div>
  );
}
