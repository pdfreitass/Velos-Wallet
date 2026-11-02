import { useParams } from "react-router";

import { FormPageShell, FormSkeleton } from "@/components/shared/FormPageShell";
import { LoadError } from "@/components/shared/LoadError";
import { AccountForm } from "@/features/accounts/AccountForm";
import { useAccount } from "@/features/accounts/api";
import { DeleteAccountDialog } from "@/features/accounts/DeleteAccountDialog";
import { ApiError } from "@/lib/api/client";
import { ROUTES } from "@/lib/auth/routes";
import { NotFoundPage } from "@/pages/NotFoundPage";

const back = { backTo: ROUTES.accounts, backLabel: "Contas" };

/** /contas/nova */
export function NewAccountPage() {
  return (
    <FormPageShell title="Nova conta" {...back}>
      <AccountForm />
    </FormPageShell>
  );
}

/**
 * /contas/:id. Inexistente, de outra pessoa ou id inválido: a API responde o mesmo 404, e a tela
 * mostra o mesmo "não encontrado" (CA11), sem revelar se a conta existe.
 */
export function EditAccountPage() {
  const { id = "" } = useParams();
  const account = useAccount(id);

  if (account.isError && account.error instanceof ApiError && account.error.status === 404) {
    return <NotFoundPage title="Conta não encontrada" backTo={ROUTES.accounts} backLabel="Ver minhas contas" />;
  }

  return (
    <FormPageShell title="Editar conta" {...back}>
      {account.isPending ? (
        <FormSkeleton label="Carregando a conta…" />
      ) : account.isError ? (
        <LoadError
          title="Não foi possível carregar a conta"
          message="Confira sua conexão e tente de novo em instantes."
          onRetry={() => void account.refetch()}
          isRetrying={account.isFetching}
        />
      ) : (
        <AccountForm account={account.data} footer={<DeleteAccountDialog account={account.data} />} />
      )}
    </FormPageShell>
  );
}
