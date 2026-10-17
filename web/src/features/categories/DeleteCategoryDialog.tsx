import { useState } from "react";
import { LoaderCircle, Receipt, Trash2, TriangleAlert } from "lucide-react";
import { useNavigate } from "react-router";

import { FormAlert } from "@/components/shared/FormAlert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toErrorAlert } from "@/lib/api/errors";
import { ROUTES } from "@/lib/auth/routes";

import { useCategoryDeletionImpact, useDeleteCategory } from "./api";
import { TYPE_PARAM, typeToParam, type Category } from "./types";

/**
 * RN11: excluir pede confirmação e diz quantas movimentações passam a "Sem categoria" (elas
 * continuam existindo). "Cancelar" recebe o foco ao abrir; Esc fecha (Base UI).
 */
export function DeleteCategoryDialog({ category }: { category: Category }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const impact = useCategoryDeletionImpact(category.id, open);
  const remove = useDeleteCategory(category.id);
  const count = impact.data?.transactionCount ?? 0;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) remove.reset();
  }

  function handleDelete() {
    remove.mutate(undefined, {
      onSuccess: () => navigate(`${ROUTES.categories}?${TYPE_PARAM}=${typeToParam(category.type)}`, { replace: true }),
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen(true)}
        className="h-11 w-full text-base text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 aria-hidden="true" />
        Excluir categoria
      </Button>

      <AlertDialogContent>
        <AlertDialogHeader className="text-left">
          <AlertDialogTitle>Excluir “{category.name}”?</AlertDialogTitle>
          {impact.isPending ? (
            <div aria-busy="true" className="space-y-2">
              <span role="status" className="sr-only">Contando as movimentações…</span>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : impact.isError ? (
            <FormAlert message={toErrorAlert(impact.error).message} />
          ) : (
            <AlertDialogDescription render={<ul className="space-y-2.5 text-left text-foreground" />}>
              {count > 0 ? (
                <li className="flex gap-2.5">
                  <Receipt className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>
                    <strong>
                      {count} {count === 1 ? "movimentação usa" : "movimentações usam"}
                    </strong>{" "}
                    essa categoria. {count === 1 ? "Ela continua existindo e passa" : "Elas continuam existindo e passam"} a
                    aparecer como <strong>“Sem categoria”</strong>.
                  </span>
                </li>
              ) : null}
              <li className="flex gap-2.5">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
                Não dá para desfazer.
              </li>
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>

        {remove.isError ? <FormAlert message={toErrorAlert(remove.error).message} /> : null}

        <AlertDialogFooter>
          <Button
            variant="destructive"
            className="h-11 text-base"
            disabled={!impact.isSuccess || remove.isPending}
            onClick={handleDelete}
          >
            {remove.isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
            {remove.isPending ? "Excluindo…" : "Excluir categoria"}
          </Button>
          <AlertDialogCancel className="h-11 text-base" autoFocus>
            Cancelar
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
