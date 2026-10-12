import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import {
  PASSWORD_RESET_COOKIE,
  passwordResetCookieOptions,
} from "@/lib/auth/password-reset";
import { ROUTES } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";
import { getSafeRedirect } from "@/lib/utils/redirect";

/**
 * Destino dos links enviados por email (spec 001, RN6).
 *
 * Aceita os dois formatos do Supabase:
 * - `token_hash` + `type`: o dos nossos modelos de email. Funciona mesmo que o
 *   link seja aberto noutro dispositivo.
 * - `code`: o do modelo padrao (PKCE). So funciona no browser que pediu o link.
 *
 * Route handler e nao Server Action: quem chega aqui e um clique num link
 * (GET), e e preciso gravar a sessao em cookies antes de redirecionar.
 */

const EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  "signup",
  "email",
  "recovery",
  "invite",
  "magiclink",
  "email_change",
]);

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return value !== null && EMAIL_OTP_TYPES.has(value as EmailOtpType);
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  const code = params.get("code");

  const supabase = await createClient();
  let userId: string | null = null;
  let isRecovery = false;

  if (tokenHash && isEmailOtpType(type)) {
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      userId = data.user?.id ?? null;
      isRecovery = type === "recovery";
    }
  } else if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      userId = data.user?.id ?? null;
      // A biblioteca guarda junto do PKCE que o pedido foi de recuperacao e
      // devolve-o em `redirectType`, mas o tipo publico (AuthTokenResponse)
      // nao declara o campo. Leitura defensiva, sem `any`.
      isRecovery = "redirectType" in data && data.redirectType === "recovery";
    }
  }

  if (!userId) {
    redirect(`${ROUTES.authError}?motivo=link-invalido`);
  }

  if (isRecovery) {
    // Libera /redefinir-senha por 15 min, so para ESTE utilizador.
    const cookieStore = await cookies();
    cookieStore.set(PASSWORD_RESET_COOKIE, userId, passwordResetCookieOptions);
    redirect(ROUTES.resetPassword);
  }

  redirect(getSafeRedirect(params.get("next")));
}
