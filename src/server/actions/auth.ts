"use server";

import { redirect } from "next/navigation";

import {
  MAX_LOGIN_ATTEMPTS,
  WARN_AFTER_FAILURES,
  clearMyLoginFailures,
  getLockState,
  minutesUntil,
  registerLoginFailure,
  type LockState,
} from "@/lib/auth/lockout";
import { ROUTES } from "@/lib/auth/routes";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getSafeRedirect } from "@/lib/utils/redirect";
import {
  signInSchema,
  signUpSchema,
  type SignInInput,
  type SignUpInput,
} from "@/lib/validations/auth";
import { toFieldErrors, type FieldErrors } from "@/lib/validations/utils";

/**
 * Server Actions da autenticacao (spec 001). Todas revalidam a entrada com o
 * mesmo schema do formulario: o client nunca e a unica barreira. Em caso de
 * sucesso fazem redirect (que interrompe a funcao); so devolvem em erro.
 */

const GENERIC_ERROR = "Não foi possível concluir agora. Tente novamente em instantes.";
const RATE_LIMITED = "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.";

// ------------------------------------------------------------------ entrar

export type SignInResult =
  | { status: "invalid"; message: string; attemptsLeft: number | null }
  | { status: "locked"; message: string; minutesLeft: number }
  | { status: "error"; message: string; fieldErrors?: FieldErrors<keyof SignInInput> };

function lockedResult(lockedUntil: Date): SignInResult {
  const minutesLeft = minutesUntil(lockedUntil);
  return {
    status: "locked",
    minutesLeft,
    message: `Muitas tentativas incorretas. Tente novamente em ${minutesLeft} ${minutesLeft === 1 ? "minuto" : "minutos"} ou redefina sua senha.`,
  };
}

export async function signIn(input: unknown, next?: string): Promise<SignInResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "Verifique os campos destacados.", fieldErrors: toFieldErrors(parsed.error) };
  }
  const { email, password } = parsed.data;
  const supabase = await createClient();

  // Falha FECHADA: se nao der para consultar o bloqueio, nao tenta entrar.
  let lock: LockState;
  try {
    lock = await getLockState(supabase, email);
  } catch {
    return { status: "error", message: GENERIC_ERROR };
  }
  if (lock.lockedUntil) return lockedResult(lock.lockedUntil);

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "invalid_credentials") {
      const after = await registerLoginFailure(supabase, email).catch(() => null);
      if (after?.lockedUntil) return lockedResult(after.lockedUntil);
      const failures = after?.failedCount ?? 0;
      const attemptsLeft = MAX_LOGIN_ATTEMPTS - failures;
      return {
        status: "invalid",
        message: "Email ou senha incorretos.",
        attemptsLeft: failures >= WARN_AFTER_FAILURES ? attemptsLeft : null,
      };
    }
    if (error.code === "over_request_rate_limit") return { status: "error", message: RATE_LIMITED };
    return { status: "error", message: GENERIC_ERROR };
  }

  // Login certo zera a contagem. Se falhar, o login ja valeu: nao bloqueia.
  await clearMyLoginFailures(supabase).catch(() => undefined);
  redirect(getSafeRedirect(next));
}

// ------------------------------------------------------------------ cadastro

export type SignUpResult =
  | { status: "error"; message: string; fieldErrors?: FieldErrors<keyof SignUpInput> }
  /** So acontece se a confirmacao de email for religada no Supabase. */
  | { status: "confirm-email"; message: string };

export async function signUp(input: unknown): Promise<SignUpResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "Verifique os campos destacados.", fieldErrors: toFieldErrors(parsed.error) };
  }
  const { name, email, password } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Lido pelo trigger handle_new_user para preencher profiles.name (RN9).
      data: { full_name: name },
      emailRedirectTo: `${env.siteUrl}/auth/confirm?next=${ROUTES.home}`,
    },
  });

  if (error) {
    if (error.code === "user_already_exists" || error.code === "email_exists") {
      return emailTaken();
    }
    if (error.code === "weak_password") {
      return {
        status: "error",
        message: "Verifique os campos destacados.",
        fieldErrors: { password: "A senha não atende aos requisitos de segurança." },
      };
    }
    if (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit") {
      return { status: "error", message: RATE_LIMITED };
    }
    return { status: "error", message: GENERIC_ERROR };
  }

  // Com a confirmacao LIGADA, o Supabase nao da erro para email repetido:
  // devolve um utilizador sem identidades. Sem sessao = falta confirmar.
  if (!data.session) {
    if (data.user?.identities?.length === 0) return emailTaken();
    return {
      status: "confirm-email",
      message: "Enviamos um link de confirmação para o seu email.",
    };
  }

  redirect(ROUTES.home);
}

/** Revisao 1 da spec: sem confirmacao de email nao ha como esconder isto. */
function emailTaken(): SignUpResult {
  return {
    status: "error",
    message: "Este email já está cadastrado.",
    fieldErrors: { email: "Este email já está cadastrado. Entre ou redefina sua senha." },
  };
}

// ------------------------------------------------------------------ google

export async function signInWithGoogle(next?: string): Promise<{ message: string }> {
  const supabase = await createClient();
  const callback = new URL("/auth/callback", env.siteUrl);
  callback.searchParams.set("next", getSafeRedirect(next));

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callback.toString() },
  });

  if (error || !data.url) {
    return { message: "Não foi possível conectar com o Google. Tente novamente." };
  }
  redirect(data.url);
}

// ------------------------------------------------------------------ sair

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  // "local": encerra ESTA sessao no servidor (revoga o refresh token), sem
  // derrubar o utilizador nos outros dispositivos (RN12).
  await supabase.auth.signOut({ scope: "local" });
  redirect(ROUTES.signIn);
}
