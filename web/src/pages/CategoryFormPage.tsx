import { useParams, useSearchParams } from "react-router";

import { FormPageShell, FormSkeleton } from "@/components/shared/FormPageShell";
import { LoadError } from "@/components/shared/LoadError";
import { useCategory } from "@/features/categories/api";
import { CategoryForm } from "@/features/categories/CategoryForm";
import { DeleteCategoryDialog } from "@/features/categories/DeleteCategoryDialog";
import { TYPE_PARAM, typeFromParam, typeToParam } from "@/features/categories/types";
import { ApiError } from "@/lib/api/client";
import { ROUTES } from "@/lib/auth/routes";
import { NotFoundPage } from "@/pages/NotFoundPage";

/** /categorias/nova (?tipo=receitas abre já em Receita). */
export function NewCategoryPage() {
  const [params] = useSearchParams();
  const type = typeFromParam(params.get(TYPE_PARAM));
  return (
    <FormPageShell
      title="Nova categoria"
      backTo={`${ROUTES.categories}?${TYPE_PARAM}=${typeToParam(type)}`}
      backLabel="Categorias"
    >
      <CategoryForm initialType={type} />
    </FormPageShell>
  );
}

/** /categorias/:id. Inexistente, alheia ou id inválido: o mesmo "não encontrado" (CA11). */
export function EditCategoryPage() {
  const { id = "" } = useParams();
  const category = useCategory(id);

  if (category.isError && category.error instanceof ApiError && category.error.status === 404) {
    return <NotFoundPage title="Categoria não encontrada" backTo={ROUTES.categories} backLabel="Ver minhas categorias" />;
  }

  const backTo = category.data ? `${ROUTES.categories}?${TYPE_PARAM}=${typeToParam(category.data.type)}` : ROUTES.categories;

  return (
    <FormPageShell title="Editar categoria" backTo={backTo} backLabel="Categorias">
      {category.isPending ? (
        <FormSkeleton label="Carregando a categoria…" />
      ) : category.isError ? (
        <LoadError
          title="Não foi possível carregar a categoria"
          message="Confira sua conexão e tente de novo em instantes."
          onRetry={() => void category.refetch()}
          isRetrying={category.isFetching}
        />
      ) : (
        <CategoryForm category={category.data} footer={<DeleteCategoryDialog category={category.data} />} />
      )}
    </FormPageShell>
  );
}
