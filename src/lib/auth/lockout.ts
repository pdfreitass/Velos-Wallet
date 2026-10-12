import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

/**
 * Bloqueio de tentativas de login (spec 001, RN5 · ADR 0013).
 * A regra vive no banco (migration 0005); aqui so se chamam as funcoes.
 */

/** Espelha supabase/migrations/0005_login_attempts.sql. */
export const MAX_LOGIN_ATTEMPTS = 5;
/** A partir de quantas falhas a tela avisa quantas tentativas restam. */
export const WARN_AFTER_FAILURES = 3;

type Client = SupabaseClient<Database>;

export type LockState = {
  failedCount: number;
  lockedUntil: Date | null;
};

type LockRow = { failed_count: number; locked_until: string | null };

function toLockState(rows: LockRow[] | null): LockState {
  const row = rows?.[0];
  return {
    failedCount: row?.failed_count ?? 0,
    // O gerador de tipos marca locked_until como string, mas a funcao devolve
    // null quando nao ha bloqueio.
    lockedUntil: row?.locked_until ? new Date(row.locked_until) : null,
  };
}

export async function getLockState(supabase: Client, email: string): Promise<LockState> {
  const { data, error } = await supabase.rpc("login_lock_status", { p_email: email });
  if (error) throw error;
  return toLockState(data);
}

export async function registerLoginFailure(
  supabase: Client,
  email: string,
): Promise<LockState> {
  const { data, error } = await supabase.rpc("register_login_failure", { p_email: email });
  if (error) throw error;
  return toLockState(data);
}

/** Zera o bloqueio do proprio utilizador. Exige sessao (o banco garante). */
export async function clearMyLoginFailures(supabase: Client): Promise<void> {
  const { error } = await supabase.rpc("clear_my_login_failures");
  if (error) throw error;
}

/** Minutos que faltam, arredondados para cima e nunca menos de 1. */
export function minutesUntil(date: Date): number {
  return Math.max(1, Math.ceil((date.getTime() - Date.now()) / 60_000));
}
