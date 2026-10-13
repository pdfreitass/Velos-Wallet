import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";

export type FieldControlProps = {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
};

type FormFieldProps = {
  id: string;
  label: string;
  error?: string;
  /** Texto de apoio ligado ao campo por aria-describedby (ex.: requisitos da senha). */
  describedBy?: string;
  /** Algo ao lado do rótulo, como o link "Esqueci minha senha". */
  labelAside?: ReactNode;
  children: (control: FieldControlProps) => ReactNode;
  footer?: ReactNode;
};

/** Rótulo + controle + erro, com os atributos de acessibilidade ligados (CA-a11y da spec 001). */
export function FormField({ id, label, error, describedBy, labelAside, children, footer }: FormFieldProps) {
  const errorId = `${id}-error`;
  const descriptions = [error ? errorId : null, describedBy ?? null].filter(Boolean).join(" ");

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        {labelAside}
      </div>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": descriptions || undefined })}
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {footer}
    </div>
  );
}
