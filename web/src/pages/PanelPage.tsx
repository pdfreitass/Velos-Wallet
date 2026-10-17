import { ChevronRight, Tags, Wallet, type LucideIcon } from "lucide-react";
import { Link } from "react-router";

import { useCurrentUser } from "@/features/auth/api";
import { ROUTES } from "@/lib/auth/routes";

/**
 * Início (P4 da spec 002): "Olá" + atalhos para Contas e Categorias até o dashboard da Etapa 6.
 * A casca (cabeçalho, navegação e Sair) vem do AppLayout.
 */
export function PanelPage() {
  const me = useCurrentUser();
  const firstName = me.data?.name.split(" ")[0] ?? "";

  return (
    <div className="mx-auto max-w-2xl lg:mx-0">
      <title>Início · Velos Wallet</title>
      <h1 className="text-3xl font-semibold tracking-tight">Olá, {firstName}</h1>
      <p className="mt-2 text-muted-foreground">
        Comece cadastrando suas contas e ajustando as categorias. O resumo do mês chega em breve.
      </p>

      <ul className="mt-8 flex flex-col gap-3">
        <li>
          <Shortcut to={ROUTES.accounts} Icon={Wallet} title="Contas" description="Saldo de cada conta e cartão" />
        </li>
        <li>
          <Shortcut to={ROUTES.categories} Icon={Tags} title="Categorias" description="Cor e ícone de cada categoria" />
        </li>
      </ul>
    </div>
  );
}

type ShortcutProps = { to: string; Icon: LucideIcon; title: string; description: string };

function Shortcut({ to, Icon, title, description }: ShortcutProps) {
  return (
    <Link
      to={to}
      className="flex min-h-11 items-center gap-4 rounded-xl border border-border bg-card p-4 text-card-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{title}</span>
        <span className="block text-sm text-muted-foreground">{description}</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  );
}
