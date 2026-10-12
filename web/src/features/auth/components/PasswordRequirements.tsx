import { Check, Circle, X } from "lucide-react";
import { cn } from "cn";

import { PASSWORD_REQUIREMENTS } from "@/lib/validations/auth";

type PasswordRequirementsProps = {
  id: string;
  password: string;
  /** Depois de um envio recusado, o que falta vira erro (✕ + cor de erro), não só cinza. */
  invalid?: boolean;
};

/**
 * Checklist ao vivo da RN1. Não depende só de cor: o ícone muda de forma (✓ / ○ / ✕) e o leitor
 * de tela ouve "atendido" ou "pendente". Ligado ao campo de senha por aria-describedby.
 */
export function PasswordRequirements({ id, password, invalid = false }: PasswordRequirementsProps) {
  return (
    <ul id={id} className="grid gap-1.5 text-sm" aria-label="Requisitos da senha">
      {PASSWORD_REQUIREMENTS.map((requirement) => {
        const met = requirement.test(password);
        const Icon = met ? Check : invalid ? X : Circle;
        return (
          <li
            key={requirement.id}
            className={cn(
              "flex items-center gap-2",
              met ? "text-foreground" : invalid ? "text-destructive" : "text-muted-foreground",
            )}
          >
            <Icon
              className={cn("size-4 shrink-0", met && "text-primary", !met && !invalid && "size-3.5")}
              strokeWidth={met || invalid ? 2.5 : 2}
              aria-hidden="true"
            />
            {requirement.label}
            <span className="sr-only">{met ? ": atendido" : ": pendente"}</span>
          </li>
        );
      })}
    </ul>
  );
}
