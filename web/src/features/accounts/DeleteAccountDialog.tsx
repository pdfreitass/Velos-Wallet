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
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toErrorAlert } from "@/lib/api/errors";
import { ROUTES } from "@/lib/auth/routes";

import { useAccountDeletionImpact, useDeleteAccount } from "./api";
import { DeletionFacts } from "./DeletionFacts";
import { movementCount, type Account } from "./types";

/**
 * RN6: excluir apaga a conta e as movimentações. Sem movimentações, confirmação curta; com elas,
 * os fatos em detalhe e o botão só ativa depois de "Entendi que isso não pode ser desfeito".
 * "Cancelar" recebe o foco ao abrir; Esc fecha (Base UI).
 */
export function DeleteAccountDialog({ account }: { account: Account }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const impact = useAccountDeletionImpact(account.id, open);
  const remove = useDeleteAccount(account.id);

  const total = impact.data ? movementCount(impact.data) : 0;
  const needsConfirmation = total > 0;
  const canDelete = impact.isSuccess && (!needsConfirmation || understood) && !remove.isPending;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setUnderstood(false);
      remove.reset();
    }
  }

  function handleDelete() {
    remove.mutate(undefined, { onSuccess: () => navigate(ROUTES.accounts, { replace: true }) });
  }

  const actionLabel = needsConfirmation
    ? `Excluir conta e ${total} ${total === 1 ? "movimentação" : "movimentações"}`
    : "Excluir conta";

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen(true)}
        className="h-11 w-full text-base text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 aria-hidden="true" />
        Excluir conta
      </Button>

      <AlertDialogContent>
        <AlertDialogHeader className="text-left">
          <AlertDialogTitle>Excluir “{account.name}”?</AlertDialogTitle>
          {impact.isPending ? (
            <div aria-busy="true" className="space-y-2">
              <span role="status" className="sr-only">Contando as movimentações…</span>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : impact.isError ? (
            <FormAlert message={toErrorAlert(impact.error).message} />
          ) : needsConfirmation ? (
            <AlertDialogDescription render={<div />}>
              <DeletionFacts impact={impact.data} />
            </AlertDialogDescription>
          ) : (
            <AlertDialogDescription>Não dá para desfazer.</AlertDialogDescription>
          )}
        </AlertDialogHeader>

        {needsConfirmation ? (
          <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl bg-secondary px-3 text-secondary-foreground">
            <Checkbox checked={understood} onCheckedChange={(checked) => setUnderstood(checked)} />
            Entendi que isso não pode ser desfeito
          </label>
        ) : null}

        {remove.isError ? <FormAlert message={toErrorAlert(remove.error).message} /> : null}

        <AlertDialogFooter>
          <Button variant="destructive" className="h-11 text-base" disabled={!canDelete} onClick={handleDelete}>
            {remove.isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
            {remove.isPending ? "Excluindo…" : actionLabel}
          </Button>
          <AlertDialogCancel className="h-11 text-base" autoFocus>
            Cancelar
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
