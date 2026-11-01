import { useState } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
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
import { toErrorAlert } from "@/lib/api/errors";
import { ROUTES } from "@/lib/auth/routes";
import { formatCurrency } from "@/lib/utils/currency";

import { useDeleteGoal } from "./api";
import type { Goal } from "./types";

/**
 * RN7: excluir a meta apaga os aportes dela. A confirmação diz **quantos** aportes e **quanto**
 * somam — os dois números já vêm da meta (contagem e juntado somados no banco).
 */
export function DeleteGoalDialog({ goal }: { goal: Goal }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const remove = useDeleteGoal(goal.id);
  const count = goal.contributionCount;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) remove.reset();
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
        Excluir meta
      </Button>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir “{goal.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            {count === 0
              ? "A meta não tem aportes. Não dá para desfazer."
              : count === 1
                ? `O aporte desta meta, de ${formatCurrency(goal.currentCents)}, também será apagado. Não dá para desfazer.`
                : `Os ${count} aportes desta meta, que somam ${formatCurrency(goal.currentCents)}, também serão apagados. Não dá para desfazer.`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {remove.isError ? <FormAlert message={toErrorAlert(remove.error).message} /> : null}

        <AlertDialogFooter>
          <Button
            variant="destructive"
            className="h-11 text-base"
            disabled={remove.isPending}
            onClick={() =>
              remove.mutate(undefined, { onSuccess: () => navigate(ROUTES.goals, { replace: true }) })
            }
          >
            {remove.isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
            {remove.isPending ? "Excluindo…" : count === 0 ? "Excluir meta" : `Excluir meta e ${count === 1 ? "o aporte" : "os aportes"}`}
          </Button>
          <AlertDialogCancel className="h-11 text-base" autoFocus disabled={remove.isPending}>
            Cancelar
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
