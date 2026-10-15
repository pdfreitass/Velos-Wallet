/**
 * Tokens da identidade Velos Wallet, copiados de web/src/styles/globals.css.
 * Nenhuma cor nova foi inventada para o vídeo.
 */
export const velos = {
  deep: "#0A2E24", // verde profundo: a marca
  vivid: "#2ED38C", // verde vivo: dinheiro e acento
  offWhite: "#F4F7F2",
  lightBg: "#ECF1EA",
  card: "#1A3C32",
  mutedDark: "#A9B7B0",
  income: "#2ED38C",
  expense: "#C1393E",
} as const;

export const FONT = '"Geist Velos", ui-sans-serif, system-ui, sans-serif';

/** 26 s a 30 fps. */
export const FPS = 30;
export const DURATION = 780;

/** Marcas de corte (em frames), na ordem do ROTEIRO.md. */
export const CUES = {
  abertura: { from: 0, duration: 120 },
  icone: { from: 120, duration: 60 },
  vitrine: { from: 180, duration: 384 }, // 4 telas × 96 frames
  entrar: { from: 564, duration: 96 },
  fecho: { from: 660, duration: 120 },
} as const;
