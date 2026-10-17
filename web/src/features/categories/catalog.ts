import {
  Baby,
  Briefcase,
  Bus,
  Car,
  CircleDashed,
  Coffee,
  Droplet,
  Dumbbell,
  Film,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  HandCoins,
  HeartPulse,
  House,
  PawPrint,
  PiggyBank,
  Pill,
  Plane,
  Receipt,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Tag,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * RN10 da spec 002: paleta e ícones fixos. Espelho de
 * api/src/Velos.Domain/Categories/CategoryCatalog.cs (mesma ordem e mesmos valores).
 *
 * O banco guarda o hex "canônico"; a tela usa o token `--category-*` do globals.css, que tem um
 * tom por tema com o ícone >= 3:1 (contraste medido lá). Por isso nunca pintar com o hex direto.
 */
export const CATEGORY_COLORS = [
  { hex: "#E8833A", token: "orange", label: "Laranja" },
  { hex: "#4F8DF7", token: "blue", label: "Azul" },
  { hex: "#7C5CF5", token: "violet", label: "Violeta" },
  { hex: "#E05260", token: "red", label: "Vermelho" },
  { hex: "#D94FA8", token: "pink", label: "Rosa" },
  { hex: "#2F9BB8", token: "cyan", label: "Ciano" },
  { hex: "#6B8075", token: "gray", label: "Cinza" },
  { hex: "#1C7F54", token: "green", label: "Verde" },
  { hex: "#2ED38C", token: "mint", label: "Verde-claro" },
  { hex: "#4FA37A", token: "sage", label: "Verde-sálvia" },
  { hex: "#C7A23A", token: "mustard", label: "Mostarda" },
  { hex: "#8A6A4F", token: "brown", label: "Marrom" },
] as const;

export const CATEGORY_ICONS = {
  "utensils-crossed": { Icon: UtensilsCrossed, label: "Talheres" },
  house: { Icon: House, label: "Casa" },
  car: { Icon: Car, label: "Carro" },
  "heart-pulse": { Icon: HeartPulse, label: "Saúde" },
  "gamepad-2": { Icon: Gamepad2, label: "Videogame" },
  "graduation-cap": { Icon: GraduationCap, label: "Formatura" },
  "circle-dashed": { Icon: CircleDashed, label: "Outros" },
  wallet: { Icon: Wallet, label: "Carteira" },
  briefcase: { Icon: Briefcase, label: "Maleta" },
  tag: { Icon: Tag, label: "Etiqueta" },
  "shopping-cart": { Icon: ShoppingCart, label: "Carrinho de compras" },
  "shopping-bag": { Icon: ShoppingBag, label: "Sacola" },
  coffee: { Icon: Coffee, label: "Café" },
  plane: { Icon: Plane, label: "Avião" },
  bus: { Icon: Bus, label: "Ônibus" },
  fuel: { Icon: Fuel, label: "Combustível" },
  shirt: { Icon: Shirt, label: "Roupa" },
  gift: { Icon: Gift, label: "Presente" },
  baby: { Icon: Baby, label: "Bebê" },
  "paw-print": { Icon: PawPrint, label: "Pet" },
  dumbbell: { Icon: Dumbbell, label: "Academia" },
  film: { Icon: Film, label: "Cinema" },
  smartphone: { Icon: Smartphone, label: "Celular" },
  zap: { Icon: Zap, label: "Energia" },
  droplet: { Icon: Droplet, label: "Água" },
  receipt: { Icon: Receipt, label: "Conta a pagar" },
  "piggy-bank": { Icon: PiggyBank, label: "Cofrinho" },
  "trending-up": { Icon: TrendingUp, label: "Investimentos" },
  "hand-coins": { Icon: HandCoins, label: "Dinheiro na mão" },
  pill: { Icon: Pill, label: "Remédio" },
} as const satisfies Record<string, { Icon: LucideIcon; label: string }>;

export type CategoryColorHex = (typeof CATEGORY_COLORS)[number]["hex"];
export type CategoryIconName = keyof typeof CATEGORY_ICONS;

/** Valor CSS da cor no tema atual. Cor fora da paleta (não deveria vir da API) cai no texto. */
export function categoryColorVar(hex: string): string {
  const color = CATEGORY_COLORS.find((c) => c.hex === hex.toUpperCase());
  return color ? `var(--category-${color.token})` : "var(--foreground)";
}

/** Ícone fora da lista (não deveria vir da API) cai na etiqueta, o default da coluna. */
export function categoryIcon(name: string): LucideIcon {
  return name in CATEGORY_ICONS ? CATEGORY_ICONS[name as CategoryIconName].Icon : Tag;
}
