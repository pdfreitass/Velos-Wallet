import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";

/** Erro do formulário inteiro, anunciado ao leitor de tela (role="alert"). Diz o problema e a saída. */
export function FormAlert({ message, children }: { message: string; children?: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/8 p-3 text-sm"
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
      <div className="space-y-1.5">
        <p>{message}</p>
        {children}
      </div>
    </div>
  );
}
