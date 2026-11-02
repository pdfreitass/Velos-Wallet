/**
 * Gera a trilha da versão vertical: `remotion/public/audio/trilha.wav`.
 *
 * São duas camadas no mesmo arquivo:
 *   MÚSICA — pad, baixo, kick, hi-hat e arpejo, com estrutura que segue o roteiro.
 *   EFEITOS — os "barulhinhos" colados nas animações: toque no ícone, deslize entre telas,
 *             contagem dos números, barras crescendo, rosca se desenhando e o impacto da chamada.
 *
 * Nada aqui é sample de terceiro: tudo é sintetizado amostra a amostra, então o áudio é tão
 * livre quanto o resto do projeto e não corre risco de reivindicação no Instagram.
 *
 * A grelha musical tem batida de 0,475 s (126 bpm), com o kick a cada 0,95 s justamente para que as trocas
 * de tela — 5,4 · 9,2 · 13,0 · 16,8 s — caiam todas em cima de um kick.
 *
 * Uso: node scripts/gerar-trilha.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Mistura, NOTA, TAU, expDecai, semearRuido, suave } from "./sintese.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));
const SAIDA = join(AQUI, "..", "public", "audio", "trilha.wav");

const DURACAO = 28.8;

/** Marcas em segundos, espelhando CUES_V de `src/vertical/temaVertical.ts` (frames ÷ 30). */
const T = {
  abertura: 0,
  toque: 3.6,
  toqueDedo: 4.2,
  vitrine: 5.4,
  privacidade: 20.6,
  fecho: 24.2,
  fechoNome: 25.0,
  fechoCta: 25.53,
  fim: 28.8,
};

/** Instante em que cada tela da vitrine entra. */
const TROCAS = [5.4, 9.2, 13.0, 16.8];

const BATIDA = 0.475;
/** Pulso do kick: meio compasso. Alinhado para cair exatamente nas trocas de tela. */
const PULSO = 0.95;
const GRELHA_KICK = 3.5;

const mix = new Mistura(DURACAO);
const ruido = semearRuido(0x5e105);

// ===========================================================================  MÚSICA
//
// Am – F – C – G: progressão sóbria, sem euforia, como o brief pede.
const ACORDES = [
  { de: 0.0, ate: 7.2, raiz: NOTA.A1, notas: [NOTA.A3, NOTA.C4, NOTA.E4] },
  { de: 7.2, ate: 14.4, raiz: NOTA.F2, notas: [NOTA.A3, NOTA.C4, NOTA.F4] },
  { de: 14.4, ate: 21.6, raiz: NOTA.C2, notas: [NOTA.G3, NOTA.C4, NOTA.E4] },
  { de: 21.6, ate: 28.8, raiz: NOTA.G2, notas: [NOTA.G3, NOTA.B3, NOTA.D4] },
];

/**
 * Ganho da música ao longo da peça. É aqui que a trilha "segue o roteiro":
 * entra discreta, cresce no toque, segura firme na vitrine, RECUA na privacidade — para a frase
 * respirar — e resolve no fecho.
 */
function intensidade(t) {
  if (t < T.toque) return 0.42 * suave(t / 1.4);
  if (t < T.vitrine) return 0.42 + 0.58 * suave((t - T.toque) / (T.vitrine - T.toque));
  if (t < T.privacidade) return 1.0;
  if (t < T.fecho) return 1.0 - 0.52 * suave((t - T.privacidade) / 0.9);
  return (0.48 + 0.52 * suave((t - T.fecho) / 1.4)) * suave((T.fim - t) / 2.4);
}

/** Pad e baixo. */
for (const acorde of ACORDES) {
  mix.janela(acorde.de, acorde.ate - acorde.de, (dt, i) => {
    const t = acorde.de + dt;
    const env = suave(dt / 1.1) * suave((acorde.ate - t) / 1.3);
    if (env <= 0) return;
    const g = env * intensidade(t);

    for (const nota of acorde.notas) {
      const f = TAU * nota * t;
      const corpo = Math.sin(f) + 0.2 * Math.sin(f * 2) + 0.06 * Math.sin(f * 3);
      const d = TAU * nota * 1.0023 * t;
      const par = Math.sin(d) + 0.2 * Math.sin(d * 2);
      mix.amostra(i, g * 0.05 * corpo, -0.5);
      mix.amostra(i, g * 0.05 * par, 0.5);
    }

    const fb = TAU * acorde.raiz * t;
    mix.amostra(i, (Math.sin(fb) + 0.34 * Math.sin(fb * 2)) * g * 0.15);
  });
}

/** Kick: entra depois do toque no ícone e sai no recuo da privacidade. */
for (let t = GRELHA_KICK + PULSO; t < T.privacidade; t += PULSO) {
  if (t < T.toqueDedo) continue;
  const g = intensidade(t);
  mix.janela(t, 0.3, (dt, i) => {
    const altura = 124 * expDecai(dt, 25) + 46;
    mix.amostra(i, Math.sin(TAU * altura * dt) * expDecai(dt, 32) * 0.52 * g);
  });
}
/** Dois kicks de resolução no fecho, para a chamada não entrar no vazio. */
for (const t of [T.fecho, T.fecho + 1.6]) {
  mix.janela(t, 0.34, (dt, i) => {
    const altura = 124 * expDecai(dt, 24) + 46;
    mix.amostra(i, Math.sin(TAU * altura * dt) * expDecai(dt, 28) * 0.46 * intensidade(t));
  });
}

/** Hi-hat nas colcheias: dá movimento sem encher. Só durante a vitrine. */
for (let t = T.vitrine; t < T.privacidade; t += BATIDA / 2) {
  const forte = Math.abs((t - 0.2) % PULSO) < 0.01;
  mix.janela(t, 0.07, (dt, i) => {
    const v = ruido() * expDecai(dt, 110) * (forte ? 0.05 : 0.028) * intensidade(t);
    mix.amostra(i, v, 0.35);
  });
}

/** Arpejo discreto por cima da vitrine: uma nota por batida, subindo dentro do acorde. */
const ARPEJO = [NOTA.E5, NOTA.A4, NOTA.C5, NOTA.G4];
TROCAS.forEach((inicioTela, k) => {
  for (let n = 0; n < 4; n++) {
    const t = inicioTela + n * PULSO;
    if (t >= T.privacidade) break;
    const nota = ARPEJO[(k + n) % ARPEJO.length];
    mix.janela(t, 0.9, (dt, i) => {
      const corpo = Math.sin(TAU * nota * dt) + 0.22 * Math.sin(TAU * nota * 2 * dt);
      const v = corpo * expDecai(dt, 5.5) * 0.05 * intensidade(t);
      mix.amostra(i, v, k % 2 === 0 ? -0.4 : 0.4);
    });
  }
});

// ==========================================================================  EFEITOS
//
// A regra: todo efeito existe porque há movimento na imagem naquele instante. Nada de som
// decorativo solto — é isso que faz o som parecer "colado" na animação em vez de por cima dela.

/** Sopro que sobe e some no corte. Usado nas trocas de cena. */
function whoosh(t, duracao, forca = 1, pan = 0) {
  let lp = 0;
  let hp = 0;
  mix.janela(t - duracao, duracao, (dt, i) => {
    const p = dt / duracao;
    // o filtro abre conforme sobe: de abafado a aberto
    const k = 0.015 + p * 0.3;
    lp = lp * (1 - k) + ruido() * k;
    hp = hp * 0.92 + (lp - hp) * 0.08;
    const env = p * p * suave((1 - p) / 0.25 + 0.4);
    mix.amostra(i, (lp - hp * 0.6) * env * 0.26 * forca, pan);
  });
}

/** Clique curto e seco: o dedo tocando o ícone. */
function clique(t, forca = 1) {
  mix.janela(t, 0.09, (dt, i) => {
    const corpo = Math.sin(TAU * 1750 * dt) * expDecai(dt, 95);
    const ar = ruido() * expDecai(dt, 180);
    mix.amostra(i, (corpo * 0.5 + ar * 0.5) * 0.3 * forca);
  });
}

/**
 * Contagem de um número: uma sucessão de grãos agudos que acompanha a desaceleração do contador.
 * Os grãos ficam mais raros conforme o número assenta, como um mostrador mecânico parando.
 */
function contagem(t, duracao, pan = 0) {
  const grãos = 16;
  for (let g = 0; g < grãos; g++) {
    // mesma curva de desaceleração do contador na tela (`saida` em tela/animacao.ts)
    const p = 1 - Math.pow(1 - g / grãos, 3);
    const quando = t + p * duracao;
    const forca = (1 - g / grãos) * 0.5 + 0.12;
    mix.janela(quando, 0.05, (dt, i) => {
      const v = Math.sin(TAU * (2400 + g * 60) * dt) * expDecai(dt, 150) * 0.05 * forca;
      mix.amostra(i, v, pan);
    });
  }
}

/** Barra crescendo: um filtro que abre, curto. */
function varrerBarra(t, duracao, pan = 0) {
  let lp = 0;
  mix.janela(t, duracao, (dt, i) => {
    const p = dt / duracao;
    const k = 0.02 + p * 0.22;
    lp = lp * (1 - k) + ruido() * k;
    const env = suave(p / 0.2) * suave((1 - p) / 0.5);
    mix.amostra(i, lp * env * 0.07, pan);
  });
}

/** Linha de lista aparecendo: um "pop" curto e grave, bem baixo. */
function pop(t, altura = 520, forca = 1) {
  mix.janela(t, 0.12, (dt, i) => {
    const f = altura * (1 + expDecai(dt, 40) * 0.5);
    mix.amostra(i, Math.sin(TAU * f * dt) * expDecai(dt, 38) * 0.05 * forca);
  });
}

// --- abertura: a marca assenta
mix.janela(0.25, 1.4, (dt, i) => {
  const env = suave(dt / 0.08) * expDecai(dt, 2.6);
  const v =
    (Math.sin(TAU * NOTA.A4 * dt) * 0.5 + Math.sin(TAU * NOTA.E5 * dt) * 0.3) * env * 0.07;
  mix.amostra(i, v);
});

// --- toque no ícone e sua abertura em tela
clique(T.toqueDedo, 1.0);
whoosh(T.vitrine, 0.75, 1.15);

// --- vitrine: cada tela tem a sua coreografia sonora
TROCAS.forEach((t, k) => {
  if (k > 0) whoosh(t, 0.42, 0.75, k % 2 === 0 ? -0.35 : 0.35);

  // o número grande conta logo no começo da tela (contar(frame, …, 2, 38) ≈ 0,07 s a 1,33 s)
  contagem(t + 0.07, 1.27, k % 2 === 0 ? 0.25 : -0.25);

  // as linhas entram escalonadas, uma a cada ~4 frames (0,133 s)
  const linhas = [4, 4, 5, 3][k];
  for (let n = 0; n < linhas; n++) {
    pop(t + 0.2 + n * 0.133, 460 + n * 28, 0.85 - n * 0.08);
  }

  // tela "Mês": as duas barras crescem; tela "Metas": três barras
  if (k === 1) {
    varrerBarra(t + 0.13, 1.07, -0.3);
    varrerBarra(t + 0.33, 1.07, 0.3);
  }
  if (k === 3) {
    for (let n = 0; n < 3; n++) varrerBarra(t + 0.2 + n * 0.2, 1.07, n === 1 ? 0 : n === 0 ? -0.3 : 0.3);
  }

  // tela "Gastos": a rosca se desenha — um tom que sobe junto com a varredura
  if (k === 2) {
    mix.janela(t + 0.13, 1.33, (dt, i) => {
      const p = dt / 1.33;
      const f = NOTA.A4 * (1 + p * 0.5);
      const env = suave(p / 0.15) * suave((1 - p) / 0.3);
      mix.amostra(i, Math.sin(TAU * f * dt) * env * 0.045);
    });
  }
});

// --- privacidade: whoosh de entrada e o ar mais limpo (a música já recuou)
whoosh(T.privacidade, 0.5, 0.85, -0.3);

// --- fecho: impacto da marca, depois a chamada
whoosh(T.fecho, 0.6, 1.0);
mix.janela(T.fecho, 1.8, (dt, i) => {
  // acorde de resolução, suspenso e aberto
  const env = suave(dt / 0.05) * expDecai(dt, 1.5);
  const v =
    (Math.sin(TAU * NOTA.G3 * dt) * 0.4 +
      Math.sin(TAU * NOTA.D4 * dt) * 0.3 +
      Math.sin(TAU * NOTA.G4 * dt) * 0.2) *
    env *
    0.085;
  mix.amostra(i, v);
});
pop(T.fechoNome, 420, 1.1);
// o botão entra: um toque claro, a última coisa que se ouve antes do silêncio
mix.janela(T.fechoCta, 1.1, (dt, i) => {
  const env = suave(dt / 0.04) * expDecai(dt, 3.4);
  const v =
    (Math.sin(TAU * NOTA.A4 * dt) * 0.45 + Math.sin(TAU * NOTA.C5 * dt) * 0.3 +
      Math.sin(TAU * NOTA.E5 * dt) * 0.22) * env * 0.095;
  mix.amostra(i, v);
});

// ========================================================================  gravar
mkdirSync(dirname(SAIDA), { recursive: true });
writeFileSync(SAIDA, mix.paraWav());
console.log(`trilha gravada: ${SAIDA} (${DURACAO}s, música + efeitos)`);
