import { z } from "zod";

/**
 * Schemas da autenticacao (spec 001). Os MESMOS schemas validam o formulario
 * (zodResolver) e a Server Action: o client nunca e a unica barreira.
 */

// ------------------------------------------------------------------ senha

/**
 * Exatamente os simbolos que o Supabase aceita em "Password requirements".
 * Se o app aceitasse outros (ex.: "c" com cedilha), a senha passaria aqui e
 * seria recusada pelo Supabase com um erro confuso.
 */
const PASSWORD_SYMBOLS = "!@#$%^&*()_+-=[]{};'\\:\"|<>?,./`~";

const symbolPattern = new RegExp(
  `[${PASSWORD_SYMBOLS.replace(/[\\\]\[^-]/g, "\\$&")}]`,
);

/** Limite do bcrypt usado pelo Supabase. */
const PASSWORD_MAX_LENGTH = 72;

export type PasswordRequirement = {
  id: "length" | "lowercase" | "uppercase" | "number" | "symbol";
  label: string;
  test: (password: string) => boolean;
};

/** RN1. Usado pelo schema e pelo checklist ao vivo da tela. */
export const PASSWORD_REQUIREMENTS: readonly PasswordRequirement[] = [
  { id: "length", label: "Pelo menos 8 caracteres", test: (p) => p.length >= 8 },
  { id: "lowercase", label: "Uma letra minúscula", test: (p) => /[a-z]/.test(p) },
  { id: "uppercase", label: "Uma letra maiúscula", test: (p) => /[A-Z]/.test(p) },
  { id: "number", label: "Um número", test: (p) => /[0-9]/.test(p) },
  {
    id: "symbol",
    label: "Um caractere especial (ex.: ! @ # $ %)",
    test: (p) => symbolPattern.test(p),
  },
];

export const passwordSchema = z
  .string()
  .max(PASSWORD_MAX_LENGTH, {
    error: `A senha pode ter no máximo ${PASSWORD_MAX_LENGTH} caracteres`,
  })
  .superRefine((password, ctx) => {
    const missing = PASSWORD_REQUIREMENTS.filter((r) => !r.test(password));
    if (missing.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: `A senha precisa ter: ${missing.map((r) => r.label.toLowerCase()).join(", ")}`,
      });
    }
  });

// ------------------------------------------------------------------ campos

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, { error: "Informe seu email" })
  .max(254, { error: "Email muito longo" })
  .pipe(z.email({ error: "Informe um email válido" }));

const nameSchema = z
  .string()
  .trim()
  .min(2, { error: "Informe seu nome" })
  .max(80, { error: "O nome pode ter no máximo 80 caracteres" });

const confirmPasswordSchema = z.string().min(1, { error: "Confirme sua senha" });

// ------------------------------------------------------------------ formularios

export const signUpSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

/** No login a senha so precisa existir: a regra forte vale para senhas novas. */
export const signInSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, { error: "Informe sua senha" })
    .max(PASSWORD_MAX_LENGTH, { error: "Email ou senha incorretos" }),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
