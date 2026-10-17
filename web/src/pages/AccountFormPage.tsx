import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { Link, useParams } from "react-router";

import { LoadError } from "@/components/shared/LoadError";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountForm } from "@/features/accounts/AccountForm";
import { useAccount } from "@/features/accounts/api";
import { DeleteAccountDialog } from "@/features/accounts/DeleteAccountDialog";
import { ApiError } from "@/lib/api/client";
import { ROUTES } from "@/lib/auth/routes";
import { NotFoundPage } from "@/pages/NotFoundPage";

/** /contas/nova */
export function NewAccountPage() {
  return (
    <FormPageShell title="Nova conta">
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
    <FormPageShell title="Editar conta">
      {account.isPending ? (
        <FormSkeleton />
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

function FormPageShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-lg lg:mx-0">
      <title>{`${title} · Velos Wallet`}</title>
      <Link
        to={ROUTES.accounts}
        className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ChevronLeft className="size-5" aria-hidden="true" />
        Contas
      </Link>
      <h1 className="mt-2 mb-6 text-3xl font-semibold tracking-tight">{title}</h1>
      {children}
    </div>
  );
}

function FormSkeleton() {
  return (
    <div aria-busy="true" className="space-y-6">
      <span role="status" className="sr-only">
        Carregando a conta…
      </span>
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}
