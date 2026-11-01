/**
 * Tokens da tela do aparelho (tema CLARO), como em `web/src/styles/globals.css`.
 *
 * A tela usa sempre o tema oposto ao da página: fundo escuro no vídeo, tela clara no aparelho.
 * Nenhuma cor aqui é nova — são as mesmas do app, só repetidas em JS porque o vídeo não carrega
 * o CSS do `web/`.
 */
export const tela = {
  fundo: "#F4F7F2",
  superficie: "#FFFFFF00", // os cartões da tela usam `muted`, não uma superfície branca
  texto: "#0A2E24",
  textoSuave: "#576E66",
  muted: "#E3EAE1",
  borda: "#D7E0D5",
  receita: "#197A50",
  despesa: "#C1393E",
  acento: "#2ED38C",
} as const;

/** Largura de referência da tela, em px do canvas do vídeo. Tudo escala a partir daqui. */
export const LARGURA_TELA = 420;
