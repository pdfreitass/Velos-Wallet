import { z } from "zod";

import { CATEGORY_COLORS, CATEGORY_ICONS, type CategoryIconName } from "@/features/categories/catalog";
import { CATEGORY_TYPES } from "@/features/categories/types";

/** RN9: o mesmo limite do CategoryRules.NameMaxLength da API. */
export const CATEGORY_NAME_MAX_LENGTH = 30;

const colorHexes = CATEGORY_COLORS.map((c) => c.hex) as [string, ...string[]];
const iconNames = Object.keys(CATEGORY_ICONS) as [CategoryIconName, ...CategoryIconName[]];

/**
 * Formulário de categoria (spec 002, RN8–RN10). Só experiência do usuário: quem decide é a API,
 * com as MESMAS mensagens (api/src/Velos.Application/Categories/CategoryInput.cs). O nome único
 * por tipo (RN9) só a API sabe (409 category_name_taken, com o erro no campo "name").
 */
export const categoryFormSchema = z.object({
  type: z.enum(CATEGORY_TYPES, { error: "Escolha o tipo da categoria" }),
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome da categoria")
    .max(CATEGORY_NAME_MAX_LENGTH, `O nome pode ter no máximo ${CATEGORY_NAME_MAX_LENGTH} caracteres`),
  color: z.enum(colorHexes, { error: "Escolha uma cor da lista" }),
  icon: z.enum(iconNames, { error: "Escolha um ícone da lista" }),
});

export type CategoryFormInput = z.input<typeof categoryFormSchema>;
export type CategoryFormValues = z.output<typeof categoryFormSchema>;
