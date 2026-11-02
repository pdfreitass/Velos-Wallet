import type { CSSProperties } from "react";
import { cn } from "cn";

import { categoryColorVar, categoryIcon } from "@/features/categories/catalog";

type CategoryBadgeProps = {
  name: string;
  /** Hex canônico gravado no banco (ex.: "#E8833A"). */
  color: string;
  /** Nome do lucide gravado no banco (ex.: "utensils-crossed"). */
  icon: string;
  className?: string;
};

/**
 * Etiqueta de categoria (RN10): ícone na cor da categoria sobre um fundo suave da mesma cor,
 * e o nome sempre na cor do texto. A categoria nunca é identificada só pela cor.
 */
export function CategoryBadge({ name, color, icon, className }: CategoryBadgeProps) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-3", className)}>
      <CategoryIcon color={color} icon={icon} />
      <span className="truncate text-foreground">{name}</span>
    </span>
  );
}

/** Só o círculo do ícone, para quando o texto ao lado não é o nome da categoria (lista de transações). */
export function CategoryIcon({ color, icon }: { color: string; icon: string }) {
  return <CategoryIconCircle color={color} Icon={categoryIcon(icon)} />;
}

type CategoryIconCircleProps = {
  color: string;
  Icon: ReturnType<typeof categoryIcon>;
};

/** Os 15% do fundo são os mesmos usados na medição de contraste do globals.css. */
function CategoryIconCircle({ color, Icon }: CategoryIconCircleProps) {
  return (
    <span
      aria-hidden="true"
      style={{ "--category": categoryColorVar(color) } as CSSProperties}
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--category)_15%,transparent)] text-(--category)"
    >
      <Icon className="size-5" />
    </span>
  );
}
