import { useState } from "react";
import { LoaderCircle, Pencil, PiggyBank, Trash2 } from "lucide-react";

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
import { formatCurrency } from "@/lib/utils/currency";
import { formatDayHeading, todayInSaoPaulo } from "@/lib/utils/date";

import { useDeleteContribution } from "./api";
import { ContributionDialog } from "./ContributionDialog";
import type { Contribution } from "./types";

/** Aportes do mais recente para o mais antigo (a ordem vem da API), com corrigir e excluir. */
export function ContributionList({ goalId, contributions }: { goalId: string; contributions: Contribution[] }) {
  const [editing, setEditing] = useState<Contribution | null>(null);
  const [removing, setRemoving] = useState<Contribution | null>(null);
  const today = todayInSaoPaulo();

  if (contributions.length === 0) return <EmptyContributions />;

  return (
    <>
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {contributions.map((contribution) => (
          <li key={contribution.id} className="flex min-h-16 items-center gap-3 px-3 py-2.5 sm:px-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
              <PiggyBank className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold tabular-nums">{formatCurrency(contribution.amountCents)}</span>
              <span className="block text-sm text-muted-foreground">
                {formatDayHeading(contribution.date, today)}
              </span>
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Corrigir o aporte de ${formatCurrency(contribution.amountCents)}`}
              onClick={() => setEditing(contribution)}
            >
              <Pencil aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Excluir o aporte de ${formatCurrency(contribution.amountCents)}`}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setRemoving(contribution)}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </li>
        ))}
      </ul>

      {editing ? (
        <ContributionDialog
          goalId={goalId}
          contribution={editing}
          open
          onOpenChange={(open) => !open && setEditing(null)}
        />
      ) : null}

      {removing ? (
        <DeleteContributionDialog goalId={goalId} contribution={removing} onClose={() => setRemoving(null)} />
      ) : null}
    </>
  );
}

function DeleteContributionDialog({
  goalId,
  contribution,
  onClose,
}: {
  goalId: string;
  contribution: Contribution;
  onClose: () => void;
}) {
  const remove = useDeleteContribution(goalId, contribution.id);

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir o aporte de {formatCurrency(contribution.amountCents)}?</AlertDialogTitle>
          <AlertDialogDescription>
            O progresso da meta volta para antes dele. Não dá para desfazer.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {remove.isError ? <FormAlert message={toErrorAlert(remove.error).message} /> : null}

        <AlertDialogFooter>
          <Button
            variant="destructive"
            className="h-11 text-base"
            disabled={remove.isPending}
            onClick={() => remove.mutate(undefined, { onSuccess: onClose })}
          >
            {remove.isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
            {remove.isPending ? "Excluindo…" : "Excluir aporte"}
          </Button>
          <AlertDialogCancel className="h-11 text-base" autoFocus disabled={remove.isPending}>
            Cancelar
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function EmptyContributions() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center">
      <p className="font-medium">Nenhum aporte ainda</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Registre quanto você já guardou para esta meta — mesmo que seja pouco.
      </p>
    </div>
  );
}
