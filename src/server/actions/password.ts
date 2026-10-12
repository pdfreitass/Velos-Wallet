"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { clearMyLoginFailures } from "@/lib/auth/lockout";
import { PASSWORD_RESET_COOKIE } from "@/lib/auth/password-reset";
import { ROUTES } from "@/lib/auth/routes";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "@/lib/validations/auth";
import { toFieldErrors, type FieldErrors } from "@/lib/validations/utils";

/** Server Actions de "esqueci a senha" e "nova senha" (spec 001, RN4, RN6). */

// ------------------------------------------------------------------ pedir link

export type ForgotPasswordResult =
  | { status: "sent"; message: string }
  | { status: "error"; message: string; fieldErrors?: FieldErrors<keyof ForgotPasswordInput> };

/** Mensagem identica exista a conta ou nao (RN4). */
const NEUTRAL_SENT =
  "Se existir uma conta com esse email, enviamos um link para redefinir a senha.";

export async function requestPasswordReset(input: unknown): Promise<ForgotPasswordResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "Verifique o email informado.", fieldErrors: toFieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.siteUrl}/auth/confirm?next=${ROUTES.resetPassword}`,
  });

  // Limite de envios nao revela nada sobre a conta: pode ser dito.
  if (error?.code === "over_email_send_rate_limit" || error?.code === "over_request_rate_limit") {
    return {
      status: "error",
      message: "Muitos pedidos em pouco tempo. Aguarde alguns minutos e tente de novo.",
    };
  }
  // Qualquer outro erro e engolido de proposito: responder diferente
  // revelaria se o email existe.
  return { status: "sent", message: NEUTRAL_SENT };
}

// ------------------------------------------------------------------ nova senha

export type UpdatePasswordResult = {
  status: "error";
  message: string;
  fieldErrors?: FieldErrors<keyof ResetPasswordInput>;
};

const LINK_EXPIRED =
  "O link de redefinição expirou ou já foi usado. Peça um novo em \"Esqueci minha senha\".";

export async function updatePassword(input: unknown): Promise<UpdatePasswordResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "Verifique os campos destacados.", fieldErrors: toFieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // So quem chegou pelo link do email (cookie gravado em /auth/confirm, ligado
  // a ESTE utilizador) pode trocar a senha sem informar a atual.
  const cookieStore = await cookies();
  if (!user || cookieStore.get(PASSWORD_RESET_COOKIE)?.value !== user.id) {
    return { status: "error", message: LINK_EXPIRED };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    if (error.code === "same_password") {
      return {
        status: "error",
        message: "Verifique os campos destacados.",
        fieldErrors: { password: "A nova senha precisa ser diferente da atual." },
      };
    }
    if (error.code === "weak_password") {
      return {
        status: "error",
        message: "Verifique os campos destacados.",
        fieldErrors: { password: "A senha não atende aos requisitos de segurança." },
      };
    }
    return { status: "error", message: "Não foi possível salvar a nova senha. Tente novamente." };
  }

  cookieStore.delete(PASSWORD_RESET_COOKIE);
  // Redefinir a senha libera o bloqueio de tentativas (RN5).
  await clearMyLoginFailures(supabase).catch(() => undefined);
  redirect(ROUTES.home);
}
