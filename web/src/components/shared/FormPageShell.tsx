import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { Link } from "react-router";

import { Skeleton } from "@/components/ui/skeleton";

type FormPageShellProps = {
  title: string;
  backTo: string;
  backLabel: string;
  children: ReactNode;
};

/** Moldura das telas de formulário (nova/editar conta e categoria): voltar, título e conteúdo. */
export function FormPageShell({ title, backTo, backLabel, children }: FormPageShellProps) {
  return (
    <div className="mx-auto max-w-lg lg:mx-0">
      <title>{`${title} · Velos Wallet`}</title>
      <Link
        to={backTo}
        className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ChevronLeft className="size-5" aria-hidden="true" />
        {backLabel}
      </Link>
      <h1 className="mt-2 mb-6 text-3xl font-semibold tracking-tight">{title}</h1>
      {children}
    </div>
  );
}

/** Carregando o item a editar: os campos em skeleton, sem conteúdo falso. */
export function FormSkeleton({ label }: { label: string }) {
  return (
    <div aria-busy="true" className="space-y-6">
      <span role="status" className="sr-only">
        {label}
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
