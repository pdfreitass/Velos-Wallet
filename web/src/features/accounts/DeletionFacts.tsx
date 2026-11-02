import { ArrowDownLeft, ArrowLeftRight, Goal, TriangleAlert } from "lucide-react";

import type { AccountDeletionImpact } from "./types";

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** "Reserva", "Reserva e Inter", "Reserva, Inter e Itaú". */
function joinNames(names: string[]): string {
  return names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} e ${names.at(-1)}`;
}

/** RN6: o que some junto com a conta, em frases curtas com ícone (não só cor). */
export function DeletionFacts({ impact }: { impact: AccountDeletionImpact }) {
  const { incomeCount, expenseCount, transferCount, affectedAccounts } = impact;
  const others = joinNames(affectedAccounts.map((a) => a.name));
  const entries = [
    incomeCount > 0 ? plural(incomeCount, "receita", "receitas") : null,
    expenseCount > 0 ? plural(expenseCount, "despesa", "despesas") : null,
  ].filter((entry): entry is string => entry !== null);

  return (
    <div className="space-y-3 text-left">
      <p>A conta e todas as movimentações dela serão apagadas:</p>
      <ul className="space-y-2.5 text-foreground">
        {entries.length > 0 ? (
          <li className="flex gap-2.5">
            <ArrowDownLeft className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span className="font-semibold">{entries.join(" e ")}</span>
          </li>
        ) : null}
        {transferCount > 0 ? (
          <li className="flex gap-2.5">
            <ArrowLeftRight className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              <strong>{plural(transferCount, "transferência", "transferências")}</strong>
              {others ? (
                <>
                  {" "}com <strong>{others}</strong>.{" "}
                  {affectedAccounts.length === 1 ? `O saldo de ${others} vai mudar.` : "O saldo dessas contas vai mudar."}
                </>
              ) : null}
            </span>
          </li>
        ) : null}
        <li className="flex gap-2.5">
          <Goal className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Suas metas não são afetadas.
        </li>
        <li className="flex gap-2.5">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
          Não dá para desfazer.
        </li>
      </ul>
    </div>
  );
}
