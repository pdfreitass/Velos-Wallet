import type { ReactNode } from "react";
import { Plus, Wallet } from "lucide-react";
import { Link, useParams } from "react-router";
import { cn } from "cn";

import { FormPageShell, FormSkeleton } from "@/components/shared/FormPageShell";
import { LoadError } from "@/components/shared/LoadError";
import { buttonVariants } from "@/components/ui/button";
import { useAccounts } from "@/features/accounts/api";
import type { Account } from "@/features/accounts/types";
import { useCategories } from "@/features/categories/api";
import type { Category } from "@/features/categories/types";
import { useTransaction } from "@/features/transactions/api";
import { DeleteTransactionDialog } from "@/features/transactions/DeleteTransactionDialog";
import { TransactionForm } from "@/features/transactions/TransactionForm";
import { ApiError } from "@/lib/api/client";
import { ROUTES } from "@/lib/auth/routes";
import { NotFoundPage } from "@/pages/NotFoundPage";

const back = { backTo: ROUTES.transactions, backLabel: "Transações" };

/** /transacoes/nova. Sem nenhuma conta, pede para cadastrar uma antes. */
export function NewTransactionPage() {
  return (
    <FormPageShell title="Nova transação" {...back}>
      <WithAccountsAndCategories>
        {(accounts, categories) =>
          accounts.length === 0 ? <NoAccounts /> : <TransactionForm accounts={accounts} categories={categories} />
        }
      </WithAccountsAndCategories>
    </FormPageShell>
  );
}

/**
 * /transacoes/:id. Inexistente, de outra pessoa ou id inválido: a API responde o mesmo 404, e a
 * tela mostra o mesmo "não encontrada" (CA11), sem revelar se a transação existe.
 */
export function EditTransactionPage() {
  const { id = "" } = useParams();
  const transaction = useTransaction(id);

  if (transaction.isError && transaction.error instanceof ApiError && transaction.error.status === 404) {
    return <NotFoundPage title="Transação não encontrada" backTo={ROUTES.transactions} backLabel="Ver transações" />;
  }

  return (
    <FormPageShell title="Editar transação" {...back}>
      {transaction.isPending ? (
        <FormSkeleton label="Carregando a transação…" />
      ) : transaction.isError ? (
        <LoadError
          title="Não foi possível carregar a transação"
          message="Confira sua conexão e tente de novo em instantes."
          onRetry={() => void transaction.refetch()}
          isRetrying={transaction.isFetching}
        />
      ) : (
        <WithAccountsAndCategories>
          {(accounts, categories) => (
            <TransactionForm
              accounts={accounts}
              categories={categories}
              transaction={transaction.data}
              footer={<DeleteTransactionDialog transaction={transaction.data} />}
            />
          )}
        </WithAccountsAndCategories>
      )}
    </FormPageShell>
  );
}

/** O formulário precisa das contas e das categorias para montar os campos e as sugestões. */
function WithAccountsAndCategories({ children }: { children: (accounts: Account[], categories: Category[]) => ReactNode }) {
  const accounts = useAccounts();
  const categories = useCategories();

  if (accounts.isPending || categories.isPending) return <FormSkeleton label="Carregando o formulário…" />;
  if (accounts.isError || categories.isError) {
    return (
      <LoadError
        title="Não foi possível carregar o formulário"
        message="Confira sua conexão e tente de novo em instantes."
        onRetry={() => {
          void accounts.refetch();
          void categories.refetch();
        }}
        isRetrying={accounts.isFetching || categories.isFetching}
      />
    );
  }

  return children(accounts.data, categories.data);
}

function NoAccounts() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <Wallet className="size-6" aria-hidden="true" />
      </span>
      <h2 className="text-lg font-semibold">Cadastre uma conta antes de lançar</h2>
      <p className="max-w-sm text-muted-foreground">Toda transação acontece numa conta: corrente, poupança, dinheiro ou cartão.</p>
      <Link to={ROUTES.newAccount} className={cn(buttonVariants(), "mt-1 h-11 px-5 text-base")}>
        <Plus aria-hidden="true" />
        Adicionar conta
      </Link>
    </div>
  );
}
