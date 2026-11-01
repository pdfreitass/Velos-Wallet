/**
 * Blocos de síntese usados por `gerar-trilha.mjs`: osciladores, envelopes, ruído e filtros.
 *
 * Tudo é calculado amostra a amostra, sem biblioteca e sem sample de terceiro — é o que torna a
 * trilha livre de direitos e reproduzível bit a bit.
 */

export const TAXA = 48000;
export const TAU = Math.PI * 2;

/** Ruído com semente fixa (mulberry32): o arquivo tem de sair idêntico a cada execução. */
export function semearRuido(semente) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
  };
}

/** Meia-cosseno: sobe de 0 a 1 sem o canto duro de uma rampa linear. */
export function suave(x) {
  const c = Math.min(Math.max(x, 0), 1);
  return 0.5 - 0.5 * Math.cos(Math.PI * c);
}

export function expDecai(dt, taxa) {
  return Math.exp(-dt * taxa);
}

/** Dois canais de áudio com os mesmos ajudantes de escrita. */
export class Mistura {
  constructor(segundos) {
    this.n = Math.round(segundos * TAXA);
    this.esq = new Float64Array(this.n);
    this.dir = new Float64Array(this.n);
  }

  /** Soma uma amostra na posição `i`, com panorama -1 (esquerda) a +1 (direita). */
  amostra(i, v, pan = 0) {
    if (i < 0 || i >= this.n) return;
    const l = v * Math.min(1, 1 - pan);
    const r = v * Math.min(1, 1 + pan);
    this.esq[i] += l;
    this.dir[i] += r;
  }

  /**
   * Percorre uma janela de tempo chamando `fn(dt, i)`, onde `dt` são os segundos desde o início
   * da janela. É a forma de escrever qualquer evento sonoro.
   */
  janela(inicio, duracao, fn) {
    const de = Math.round(inicio * TAXA);
    const ate = Math.min(de + Math.round(duracao * TAXA), this.n);
    for (let i = Math.max(0, de); i < ate; i++) fn((i - de) / TAXA, i);
  }

  /** Normaliza para um pico alvo e grava WAV PCM 16 bits. */
  paraWav(picoAlvo = 0.84) {
    let pico = 0;
    for (let i = 0; i < this.n; i++) {
      pico = Math.max(pico, Math.abs(this.esq[i]), Math.abs(this.dir[i]));
    }
    const ganho = pico > 0 ? picoAlvo / pico : 1;

    const bytes = Buffer.alloc(this.n * 4);
    for (let i = 0; i < this.n; i++) {
      // tanh suaviza picos residuais em vez de cortá-los em quadrado
      bytes.writeInt16LE(Math.round(Math.tanh(this.esq[i] * ganho * 1.05) * 32767), i * 4);
      bytes.writeInt16LE(Math.round(Math.tanh(this.dir[i] * ganho * 1.05) * 32767), i * 4 + 2);
    }

    const cab = Buffer.alloc(44);
    cab.write("RIFF", 0);
    cab.writeUInt32LE(36 + bytes.length, 4);
    cab.write("WAVE", 8);
    cab.write("fmt ", 12);
    cab.writeUInt32LE(16, 16);
    cab.writeUInt16LE(1, 20);
    cab.writeUInt16LE(2, 22);
    cab.writeUInt32LE(TAXA, 24);
    cab.writeUInt32LE(TAXA * 4, 28);
    cab.writeUInt16LE(4, 32);
    cab.writeUInt16LE(16, 34);
    cab.write("data", 36);
    cab.writeUInt32LE(bytes.length, 40);
    return Buffer.concat([cab, bytes]);
  }
}

/** Notas em Hz. */
export const NOTA = {
  A1: 55.0, C2: 65.41, E2: 82.41, F2: 87.31, G2: 98.0, A2: 110.0,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 784.0, A5: 880.0, C6: 1046.5, E6: 1318.5,
};
