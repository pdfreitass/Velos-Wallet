/**
 * Marca de "esta sessao veio de um link de redefinicao de senha".
 *
 * Sem ela, QUALQUER pessoa com acesso a uma sessao aberta (ex.: computador
 * desbloqueado) poderia abrir /redefinir-senha e trocar a senha sem saber a
 * atual. O route handler /auth/confirm grava o cookie quando o link e do tipo
 * "recovery"; a pagina e a Server Action exigem-no e conferem que pertence ao
 * mesmo utilizador da sessao.
 */

export const PASSWORD_RESET_COOKIE = "velos_pw_reset";

/** Tempo para concluir a redefinicao depois de clicar no link. */
export const PASSWORD_RESET_MAX_AGE_SECONDS = 15 * 60;

export const passwordResetCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: PASSWORD_RESET_MAX_AGE_SECONDS,
} as const;
