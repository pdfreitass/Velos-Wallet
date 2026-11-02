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

import { useDeleteTransaction } from "./api";
import { MONTH_PARAM, TRANSACTION_TYPE_INFO, type TransactionDetail } from "./types";

/**
 * RN9: confirmação curta ("Excluir esta despesa de R$ 45,90? Não dá para desfazer."). "Cancelar"
 * recebe o foco ao abrir; Esc fecha (Base UI). Confirmada, volta para o mês da transação.
 */
export function DeleteTransactionDialog({ transaction }: { transaction: TransactionDetail }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const remove = useDeleteTransaction(transaction.id);
  // "despesa", "receita" e "transferência" são femininas: "Excluir esta ...".
  const kind = TRANSACTION_TYPE_INFO[transaction.type].lower;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) remove.reset();
  }

  function handleDelete() {
    remove.mutate(undefined, {
      onSuccess: () =>
        navigate(`${ROUTES.transactions}?${MONTH_PARAM}=${transaction.date.slice(0, 7)}`, { replace: true }),
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
        Excluir transação
      </Button>

      <AlertDialogContent>
        <AlertDialogHeader className="text-left">
          <AlertDialogTitle>
            Excluir esta {kind} de {formatCurrency(transaction.amountCents)}?
          </AlertDialogTitle>
          <AlertDialogDescription>Não dá para desfazer.</AlertDialogDescription>
        </AlertDialogHeader>

        {remove.isError ? <FormAlert message={toErrorAlert(remove.error).message} /> : null}

        <AlertDialogFooter>
          <Button variant="destructive" className="h-11 text-base" disabled={remove.isPending} onClick={handleDelete}>
            {remove.isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
            {remove.isPending ? "Excluindo…" : "Excluir"}
          </Button>
          <AlertDialogCancel className="h-11 text-base" autoFocus>
            Cancelar
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
