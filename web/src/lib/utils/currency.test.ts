import { describe, expect, it } from "vitest";

import { formatCurrency, formatCurrencyInput, formatSignedCurrency, parseCurrencyInput, toCents } from "./currency";

// O Intl do pt-BR separa "R$" do número com espaço sem quebra (U+00A0).
const nbsp = " ";

describe("parseCurrencyInput", () => {
  it.each([
    ["", 0],
    ["abc", 0],
    ["R$", 0],
    ["0", 0],
    ["1.234,56", 123456],
    ["R$ 0,99", 99],
    ["0,05", 5],
    ["10", 10],
    ["1.000.000,00", 100000000],
    ["R$ 1.234,56 (aprox.)", 123456],
  ])("lê %j como %i centavos", (input, cents) => {
    expect(parseCurrencyInput(input)).toBe(cents);
  });

  it("devolve sempre um inteiro", () => {
    expect(Number.isInteger(parseCurrencyInput("12,34"))).toBe(true);
  });
});

describe("formatCurrency", () => {
  it.each([
    [0, `R$${nbsp}0,00`],
    [1, `R$${nbsp}0,01`],
    [99, `R$${nbsp}0,99`],
    [100, `R$${nbsp}1,00`],
    [123456, `R$${nbsp}1.234,56`],
    [100000000, `R$${nbsp}1.000.000,00`],
    [-250, `-R$${nbsp}2,50`],
  ])("formata %i centavos como %j", (cents, text) => {
    expect(formatCurrency(cents)).toBe(text);
  });
});

describe("formatCurrencyInput", () => {
  it("não leva o símbolo e usa duas casas", () => {
    expect(formatCurrencyInput(123456)).toBe("1.234,56");
    expect(formatCurrencyInput(5)).toBe("0,05");
  });

  it("é o inverso de parseCurrencyInput", () => {
    for (const cents of [0, 1, 99, 100, 123456, 100000000]) {
      expect(parseCurrencyInput(formatCurrencyInput(cents))).toBe(cents);
    }
  });
});

describe("formatSignedCurrency", () => {
  it("o sinal vem da direção, não do valor", () => {
    expect(formatSignedCurrency(1000, "in")).toBe(`+R$${nbsp}10,00`);
    expect(formatSignedCurrency(1000, "out")).toBe(`-R$${nbsp}10,00`);
  });
});

describe("toCents", () => {
  it.each([
    [123, 123],
    ["123", 123],
    ["123.4", 123],
    [null, 0],
    [undefined, 0],
    ["abc", 0],
    [Number.NaN, 0],
    [Number.POSITIVE_INFINITY, 0],
  ])("normaliza %j para %i", (value, cents) => {
    expect(toCents(value)).toBe(cents);
  });
});
