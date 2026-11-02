import { ArrowLeftRight, House, Plus, Tags, Target, Wallet, type LucideIcon } from "lucide-react";
import { Link, NavLink } from "react-router";
import { cn } from "cn";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/auth/routes";

type NavItem = { to: string; label: string; Icon: LucideIcon; end?: boolean };

/**
 * Menu do desktop, na ordem em que aparece. No celular a barra tem 5 espaços (quatro itens e o
 * "+"), então **Categorias fica só aqui** (P1 da spec 006): no celular, chega-se a ela pelo link
 * "Gerenciar categorias" na tela de Contas.
 */
const NAV_ITEMS = {
  home: { to: ROUTES.home, label: "Início", Icon: House, end: true },
  transactions: { to: ROUTES.transactions, label: "Transações", Icon: ArrowLeftRight },
  accounts: { to: ROUTES.accounts, label: "Contas", Icon: Wallet },
  goals: { to: ROUTES.goals, label: "Metas", Icon: Target },
  categories: { to: ROUTES.categories, label: "Categorias", Icon: Tags },
} satisfies Record<string, NavItem>;

const SIDE_NAV_ITEMS: readonly NavItem[] = Object.values(NAV_ITEMS);

const focusRing = "outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

const bottomLinkClass = `relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-xs font-medium text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:text-foreground aria-[current=page]:before:absolute aria-[current=page]:before:top-0 aria-[current=page]:before:h-0.5 aria-[current=page]:before:w-7 aria-[current=page]:before:rounded-full aria-[current=page]:before:bg-foreground [&[aria-current=page]_svg]:stroke-[2.5] ${focusRing}`;

/**
 * Celular: barra fixa no rodapé, com o botão "Nova transação" no centro (P4 da spec 004: o
 * lançamento fica sempre a um toque). O NavLink põe aria-current="page" no item atual, que ganha
 * a cor do texto, um traço acima do ícone e o ícone mais grosso (nunca só a cor).
 */
export function BottomNav() {
  const { home, transactions, accounts, goals } = NAV_ITEMS;
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5 px-2">
        <BottomLink item={home} />
        <BottomLink item={transactions} />
        <li className="flex items-center justify-center">
          <Link
            to={ROUTES.newTransaction}
            aria-label="Nova transação"
            className={cn(
              "flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform active:scale-95",
              focusRing,
            )}
          >
            <Plus className="size-6" strokeWidth={2.5} aria-hidden="true" />
          </Link>
        </li>
        <BottomLink item={accounts} />
        <BottomLink item={goals} />
      </ul>
    </nav>
  );
}

function BottomLink({ item: { to, label, Icon, end } }: { item: NavItem }) {
  return (
    <li>
      <NavLink to={to} end={end} className={bottomLinkClass}>
        <Icon className="size-5" aria-hidden="true" />
        {label}
      </NavLink>
    </li>
  );
}

/**
 * Desktop (lg+): "Nova transação" no topo e a mesma lista no menu lateral, com fundo e barra à
 * esquerda no item atual.
 */
export function SideNavLinks() {
  return (
    <div className="flex flex-col gap-4">
      <Link to={ROUTES.newTransaction} className={cn(buttonVariants(), "h-11 justify-start gap-3 px-3 text-base")}>
        <Plus className="size-5" aria-hidden="true" />
        Nova transação
      </Link>
      <nav aria-label="Navegação principal">
        <ul className="flex flex-col gap-1">
          {SIDE_NAV_ITEMS.map(({ to, label, Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={`relative flex min-h-11 items-center gap-3 rounded-lg px-3 font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground aria-[current=page]:bg-sidebar-accent aria-[current=page]:text-foreground aria-[current=page]:before:absolute aria-[current=page]:before:inset-y-2.5 aria-[current=page]:before:left-0 aria-[current=page]:before:w-0.75 aria-[current=page]:before:rounded-full aria-[current=page]:before:bg-foreground [&[aria-current=page]_svg]:stroke-[2.5] ${focusRing}`}
              >
                <Icon className="size-5" aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
