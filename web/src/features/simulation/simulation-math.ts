import { MAX_PERCENT, MIN_PERCENT } from "./types";

/**
 * O mesmo cálculo do `SimulationRules` da API (RN6, RN7 da spec 012), repetido aqui de propósito:
 * a tela recalcula em memória enquanto a pessoa move o percentual, sem ir à rede (CA6).
 *
 * Os dois lados estão presos pelos mesmos números em `simulation-math.test.ts` e em
 * `SimulationRulesTests.cs` — ao mexer num, mexer no outro.
 */

export function isValidPercent(percent: number): boolean {
  return Number.isInteger(percent) && percent >= MIN_PERCENT && percent <= MAX_PERCENT;
}

/**
 * RN6: quanto sobraria por mês ao cortar `percent`% de uma categoria que custa, em média,
 * `averageCents` por mês.
 *
 * O `+ 50` antes da divisão arredonda o meio centavo para cima, e é **o único arredondamento**:
 * as projeções multiplicam este resultado, nunca a média original.
 */
export function monthlySavingCents(averageCents: number, percent: number): number {
  if (averageCents < 0 || !isValidPercent(percent)) return 0;

  return Math.floor((averageCents * percent + 50) / 100);
}

/** RN6: múltiplo exato do valor mensal que a tela mostra. */
export function projectedCents(monthlySaving: number, months: number): number {
  if (monthlySaving < 0 || months < 0) return 0;

  return monthlySaving * months;
}
