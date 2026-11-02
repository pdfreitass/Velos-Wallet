/**
 * Ajudantes de animação das telas. Separados dos componentes para os tempos ficarem num lugar só
 * e poderem ser lidos de fora (o gerador de som usa os mesmos números para sincronizar).
 */
import { interpolate } from "remotion";

/** Suavização padrão do projeto: rápida no começo, assentando no fim. Nada de salto. */
export function saida(t: number): number {
  const x = Math.min(Math.max(t, 0), 1);
  return 1 - Math.pow(1 - x, 3);
}

/**
 * Progresso de um item numa lista escalonada.
 * `atraso` é quanto cada item espera depois do anterior, em frames.
 */
export function escalonado(frame: number, indice: number, atraso = 4, duracao = 18): number {
  return saida((frame - indice * atraso) / duracao);
}

/**
 * Conta de 0 até `alvo` com desaceleração. Devolve inteiro — centavos não têm fração.
 *
 * O valor final é cravado em `alvo` para o número nunca parar em 10.650,44 por erro de ponto
 * flutuante: os dados do app são exatos e o vídeo não pode contradizê-los.
 */
export function contar(frame: number, alvo: number, inicio = 0, duracao = 34): number {
  if (frame >= inicio + duracao) return alvo;
  const p = saida((frame - inicio) / duracao);
  return Math.round(alvo * p);
}

/** Largura de barra em percentagem, crescendo com a mesma curva dos números. */
export function crescerBarra(frame: number, alvo: number, inicio = 0, duracao = 30): number {
  return interpolate(saida((frame - inicio) / duracao), [0, 1], [0, alvo]);
}
