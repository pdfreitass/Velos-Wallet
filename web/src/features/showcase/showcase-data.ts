import {
  ArrowLeftRight,
  Banknote,
  Car,
  ChartPie,
  CircleDashed,
  CreditCard,
  Gamepad2,
  House,
  Landmark,
  Laptop,
  PiggyBank,
  Plane,
  Target,
  Umbrella,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/**
 * Dados ILUSTRATIVOS da vitrine do app (spec 003, RN2): mostram o mecanismo do produto, não os
 * números de alguém, e aparecem sempre rotulados como exemplo. Valores em centavos.
 *
 * Os totais são constantes de propósito: no app de verdade a soma vem pronta do banco (views
 * account_balances, monthly_summary, goal_progress), nunca do JS.
 */

export type ScreenId = "accounts" | "month" | "categories" | "goals";
export type AccountId = "checking" | "savings" | "cash" | "card";

export type ExampleAccount = {
  id: AccountId;
  name: string;
  kind: string;
  icon: LucideIcon;
  cents: number;
};

/** Contas que entram no saldo total. */
export const assetAccounts: ExampleAccount[] = [
  { id: "checking", name: "Conta corrente", kind: "Banco", icon: Landmark, cents: 235_000 },
  { id: "savings", name: "Poupança", kind: "Reserva", icon: PiggyBank, cents: 812_045 },
  { id: "cash", name: "Dinheiro", kind: "Na carteira", icon: Banknote, cents: 18_000 },
];

/** O cartão fica fora do saldo total e aparece como dívida (ADR 0007). */
export const cardAccount: ExampleAccount = {
  id: "card",
  name: "Cartão de crédito",
  kind: "Fora do saldo",
  icon: CreditCard,
  cents: 64_090,
};

export const allAccounts: ExampleAccount[] = [...assetAccounts, cardAccount];

/** 235.000 + 812.045 + 18.000 */
export const totalBalanceCents = 1_065_045;

export type ExampleTransaction = {
  title: string;
  category: string;
  icon: LucideIcon;
  cents: number;
  direction: "in" | "out";
};

export const monthIncomeCents = 420_000;
export const monthExpenseCents = 261_840;
/** 420.000 − 261.840 */
export const monthLeftoverCents = 158_160;
/** Saídas ÷ entradas, para a largura da barra (62,3%). */
export const monthExpenseShare = 62.3;

export const recentTransactions: ExampleTransaction[] = [
  { title: "Salário", category: "Salário", icon: Wallet, cents: 420_000, direction: "in" },
  { title: "Aluguel", category: "Moradia", icon: House, cents: 145_000, direction: "out" },
  { title: "Mercado", category: "Alimentação", icon: UtensilsCrossed, cents: 38_640, direction: "out" },
  { title: "Uber", category: "Transporte", icon: Car, cents: 3_290, direction: "out" },
];

export type ExampleCategory = {
  name: string;
  icon: LucideIcon;
  /** Cor padrão da categoria, a mesma do seed do banco (migration 0003). */
  color: string;
  cents: number;
  share: number;
};

/** Soma 261.840 (= monthExpenseCents). Participações já arredondadas para exibir. */
export const spendingByCategory: ExampleCategory[] = [
  { name: "Moradia", icon: House, color: "#4F8DF7", cents: 145_000, share: 55.4 },
  { name: "Alimentação", icon: UtensilsCrossed, color: "#E8833A", cents: 61_240, share: 23.4 },
  { name: "Transporte", icon: Car, color: "#7C5CF5", cents: 24_800, share: 9.5 },
  { name: "Lazer", icon: Gamepad2, color: "#D94FA8", cents: 18_000, share: 6.9 },
  { name: "Outros", icon: CircleDashed, color: "#6B8075", cents: 12_800, share: 4.8 },
];

export type ExampleGoal = {
  name: string;
  icon: LucideIcon;
  savedCents: number;
  targetCents: number;
  percent: number;
};

export const goals: ExampleGoal[] = [
  { name: "Viagem para Salvador", icon: Plane, savedCents: 310_000, targetCents: 500_000, percent: 62 },
  { name: "Reserva de emergência", icon: Umbrella, savedCents: 125_000, targetCents: 600_000, percent: 21 },
  { name: "Notebook novo", icon: Laptop, savedCents: 90_000, targetCents: 450_000, percent: 20 },
];

/** 310.000 + 125.000 + 90.000 */
export const goalsSavedCents = 525_000;

export type ScreenDefinition = {
  id: ScreenId;
  tab: string;
  icon: LucideIcon;
  /** Rótulo do número grande no topo da tela. */
  headline: string;
  headlineCents: number;
  /** Sinal do número grande: entrada, saída ou nenhum (saldo). */
  headlineDirection?: "in" | "out";
};

export const screens: ScreenDefinition[] = [
  { id: "accounts", tab: "Contas", icon: Wallet, headline: "Saldo total", headlineCents: totalBalanceCents },
  {
    id: "month",
    tab: "Mês",
    icon: ArrowLeftRight,
    headline: "Sobrou este mês",
    headlineCents: monthLeftoverCents,
    headlineDirection: "in",
  },
  {
    id: "categories",
    tab: "Gastos",
    icon: ChartPie,
    headline: "Gastos do mês",
    headlineCents: monthExpenseCents,
    headlineDirection: "out",
  },
  { id: "goals", tab: "Metas", icon: Target, headline: "Guardado nas metas", headlineCents: goalsSavedCents },
];

export function screenIndex(id: ScreenId): number {
  return screens.findIndex((screen) => screen.id === id);
}
