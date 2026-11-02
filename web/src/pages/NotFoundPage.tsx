import { Link } from "react-router";
import { cn } from "cn";

import { VelosMark } from "@/components/brand/VelosMark";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/auth/routes";

type NotFoundPageProps = {
  title?: string;
  backTo?: string;
  backLabel?: string;
};

/** Endereço desconhecido, e também conta/categoria inexistente ou de outra pessoa (CA11). */
export function NotFoundPage({
  title = "Página não encontrada",
  backTo = ROUTES.home,
  backLabel = "Ir para o painel",
}: NotFoundPageProps) {
  return (
    <div className="grid min-h-[60dvh] place-items-center">
      <title>{`${title} · Velos Wallet`}</title>
      <div className="max-w-sm space-y-4 text-center">
        <VelosMark className="mx-auto h-10 w-auto" />
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-muted-foreground">O endereço pode estar errado ou o item foi excluído.</p>
        <Link to={backTo} className={cn(buttonVariants(), "h-11 px-5 text-base")}>
          {backLabel}
        </Link>
      </div>
    </div>
  );
}
