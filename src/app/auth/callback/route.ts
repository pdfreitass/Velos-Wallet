import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { ROUTES } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";
import { getSafeRedirect } from "@/lib/utils/redirect";

/**
 * Retorno do login com Google (spec 001, H4).
 *
 * Google -> Supabase -> aqui com `?code=`. O code e trocado pela sessao
 * (PKCE: o verificador foi guardado em cookie por signInWithGoogle).
 * Se o utilizador cancelar no Google, chega `?error=` em vez do code.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");

  if (!code) {
    redirect(`${ROUTES.authError}?motivo=google`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    redirect(`${ROUTES.authError}?motivo=google`);
  }

  redirect(getSafeRedirect(params.get("next")));
}
