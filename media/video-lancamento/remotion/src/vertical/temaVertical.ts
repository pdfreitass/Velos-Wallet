/**
 * Marcas de corte da versão vertical (Reels/TikTok), 1080×1920 a 30 fps.
 *
 * Os tempos cresceram quando a locução entrou: uma fala em português lê a ~4,5 sílabas por
 * segundo, então uma frase de 10 sílabas ocupa ~2,2 s e as cenas de 3,2 s da versão muda não
 * deixavam respiro nenhum entre a fala e o corte. Cada tela da vitrine passou a 3,8 s.
 *
 * Mudar qualquer número daqui obriga a rever, na mesma ordem:
 *   1. `scripts/locucao.mjs`   — quando cada fala entra e quanto tempo tem
 *   2. `scripts/gerar-trilha.mjs` — as marcas `T` / `TROCAS` e a grelha do kick
 */
export const FPS_V = 30;

/** 28,8 s — ainda dentro da janela em que o Reels é assistido até o fim. */
export const DURACAO_V = 864;

/** Cada tela da vitrine. Também usado pela trilha para alinhar o kick às trocas. */
export const POR_TELA = 114;

export const CUES_V = {
  abertura: { from: 0, duration: 108 },
  icone: { from: 108, duration: 54 },
  vitrine: { from: 162, duration: POR_TELA * 4 },
  privacidade: { from: 618, duration: 108 },
  fecho: { from: 726, duration: 138 },
} as const;

/** Margem lateral segura: o Instagram cobre as bordas com a interface. */
export const MARGEM = 88;
