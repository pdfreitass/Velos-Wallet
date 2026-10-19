import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { formatDate, formatDayMonth, formatMonthLabel, parseDbDate, toDbDate, toMonthKey } from "./date";

describe("parseDbDate", () => {
  it("lê o dia na hora local, sem voltar para o dia anterior (UTC-3)", () => {
    const date = parseDbDate("2026-10-01");
    expect(date.getDate()).toBe(1);
    expect(date.getMonth()).toBe(9);
    expect(date.getHours()).toBe(0);
  });

  it("o bug que a função evita: new Date(\"yyyy-MM-dd\") cai no dia anterior em UTC-3", () => {
    expect(new Date("2026-10-01").getDate()).toBe(30);
  });

  it.each(["", "ontem", "2026-13-40"])("recusa %j", (value) => {
    expect(() => parseDbDate(value)).toThrow();
  });
});

describe("toDbDate", () => {
  it("31/10 às 23h30 continua sendo 2026-10-31", () => {
    expect(toDbDate(new Date(2026, 9, 31, 23, 30))).toBe("2026-10-31");
  });

  it("vai e volta sem mudar o dia", () => {
    for (const day of ["2026-01-01", "2026-02-28", "2028-02-29", "2026-12-31"]) {
      expect(toDbDate(parseDbDate(day))).toBe(day);
    }
  });
});

describe("formatação em pt-BR", () => {
  it("formatDate", () => {
    expect(formatDate("2026-10-11")).toBe("11/10/2026");
  });

  it("formatDayMonth", () => {
    expect(formatDayMonth("2026-10-11")).toBe("11 de outubro");
  });

  it("formatMonthLabel começa com maiúscula", () => {
    expect(formatMonthLabel("2026-10-11")).toBe("Outubro de 2026");
  });

  it("toMonthKey", () => {
    expect(toMonthKey(new Date(2026, 9, 31, 23, 30))).toBe("2026-10");
    expect(toMonthKey(parseDbDate("2026-01-01"))).toBe("2026-01");
  });
});

describe("em outro fuso (UTC)", () => {
  beforeEach(() => {
    vi.stubEnv("TZ", "UTC");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("o fuso mudou de verdade (em UTC o bug não aparece)", () => {
    expect(new Date("2026-10-01").getDate()).toBe(1);
  });

  it("toDbDate e parseDbDate também não mudam o dia", () => {
    expect(toDbDate(new Date(2026, 9, 31, 23, 30))).toBe("2026-10-31");
    expect(toDbDate(parseDbDate("2026-10-01"))).toBe("2026-10-01");
  });
});
