import { describe, expect, it } from "vitest";

import { isValidPercent, monthlySavingCents, projectedCents } from "./simulation-math";

/**
 * Os mesmos números de `SimulationRulesTests.cs`, escritos à mão dos dois lados. É este par que
 * impede o cálculo do front e o da API de divergirem em silêncio — eles existem em duplicado só
 * para a tela recalcular sem ir à rede (CA6).
 */
describe("simulation-math", () => {
  it("CA1: corte de 20% sobre R$ 400,00 dá R$ 80,00 por mês", () => {
    expect(monthlySavingCents(40_000, 20)).toBe(8_000);
  });

  it("CA2: 6 e 12 meses são múltiplos exatos do mensal mostrado", () => {
    const mensal = monthlySavingCents(40_000, 20);

    expect(projectedCents(mensal, 6)).toBe(48_000);
    expect(projectedCents(mensal, 12)).toBe(96_000);
  });

  it("RN6: a projeção usa o mensal já arredondado", () => {
    // 33% de R$ 100,01 = R$ 33,0033 ⇒ R$ 33,00 por mês.
    const mensal = monthlySavingCents(10_001, 33);
    expect(mensal).toBe(3_300);

    // 12× o arredondado = R$ 396,00. O valor exato daria R$ 396,04: a tela mentiria.
    expect(projectedCents(mensal, 12)).toBe(39_600);
  });

  it.each([
    [1_010, 50, 505],
    [101, 50, 51],
    [100, 33, 33],
    [12_345, 100, 12_345],
    [0, 100, 0],
  ])("arredonda ao centavo, meio para cima: %i × %i%% = %i", (media, percentual, esperado) => {
    expect(monthlySavingCents(media, percentual)).toBe(esperado);
  });

  it.each([0, -1, 101, 10.5, Number.NaN])("CA8: percentual %s é recusado", (percentual) => {
    expect(isValidPercent(percentual)).toBe(false);
    expect(monthlySavingCents(40_000, percentual)).toBe(0);
  });

  it.each([1, 100])("CA8: a ponta %i%% é aceita", (percentual) => {
    expect(isValidPercent(percentual)).toBe(true);
  });

  it("o teto do app projetado em 12 meses continua exato em JS", () => {
    const mensal = monthlySavingCents(99_999_999_999, 100);

    expect(mensal).toBe(99_999_999_999);
    // Abaixo de Number.MAX_SAFE_INTEGER, então ainda é inteiro exato.
    expect(projectedCents(mensal, 12)).toBe(1_199_999_999_988);
    expect(Number.isSafeInteger(projectedCents(mensal, 12))).toBe(true);
  });
});
