/**
 * Leitor das falas da locução.
 *
 * Os dados vivem em `src/vertical/falas.json` porque dois mundos precisam deles: este script
 * (Node, gera o áudio) e o `Reels.tsx` (TypeScript, monta as faixas e abaixa a música). Um JSON
 * partilhado evita a cópia que mais cedo ou mais tarde ficaria dessincronizada.
 *
 * Regra de tamanho: ~4,5 sílabas por segundo numa leitura calma. Uma fala de 10 sílabas ocupa
 * ~2,2 s. Por isso nenhuma passa de 12 sílabas: o resto do espaço é respiro, e locução sem
 * respiro soa a leitura de bula.
 *
 * O texto completo e o porquê de cada frase estão em `media/video-lancamento/LOCUCAO.md`.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));

export const FALAS = JSON.parse(
  readFileSync(join(AQUI, "..", "src", "vertical", "falas.json"), "utf8"),
).falas;

/** Pasta das faixas de voz, relativa a `remotion/public/`. */
export const PASTA_VOZ = "audio/voz";
