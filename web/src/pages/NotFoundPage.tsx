import { Link } from "react-router";
import { cn } from "cn";

import { VelosMark } from "@/components/brand/VelosMark";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/auth/routes";

export function NotFoundPage() {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <title>Página não encontrada · Velos Wallet</title>
      <div className="max-w-sm space-y-4 text-center">
        <VelosMark className="mx-auto h-10 w-auto" />
        <h1 className="text-xl font-semibold">Página não encontrada</h1>
        <p className="text-muted-foreground">O endereço pode estar errado ou a página ainda não existe.</p>
        <Link to={ROUTES.home} className={cn(buttonVariants(), "h-11 px-5 text-base")}>
          Ir para o painel
        </Link>
      </div>
    </div>
  );
}
