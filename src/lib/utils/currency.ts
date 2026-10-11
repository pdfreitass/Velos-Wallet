/**
 * Dinheiro no Velos Wallet e SEMPRE um inteiro de centavos.
 *
 * Nenhuma funcao deste ficheiro usa aritmetica de ponto flutuante sobre o
 * valor: a divisao por 100 acontece so dentro do Intl, no momento de mostrar.
 */

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const brlDecimal = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 123456 -> "R$ 1.234,56" */
export function formatCurrency(cents: number): string {
  return brl.format(cents / 100);
}

/** 123456 -> "1.234,56" (sem o simbolo, para dentro de inputs) */
export function formatCurrencyInput(cents: number): string {
  return brlDecimal.format(cents / 100);
}

/** 123456 -> "+R$ 1.234,56" / "-R$ 1.234,56". O sinal vem do tipo, nunca do valor. */
export function formatSignedCurrency(
  cents: number,
  direction: "in" | "out",
): string {
  return `${direction === "in" ? "+" : "-"}${brl.format(cents / 100)}`;
}

/**
 * Le o que o utilizador escreveu numa mascara BRL e devolve centavos.
 *
 * Trabalha apenas sobre os digitos, por isso nao perde precisao:
 * "1.234,56" -> 123456 · "R$ 0,99" -> 99 · "" -> 0
 */
export function parseCurrencyInput(input: string): number {
  const digits = input.replace(/\D/g, "");
  if (digits === "") return 0;
  return Number.parseInt(digits, 10);
}

/**
 * Normaliza um valor de dinheiro vindo do banco.
 *
 * `bigint` chega como number, mas agregados (`sum()`) sao `numeric` no
 * Postgres e podem chegar como string. Esta funcao e a fronteira unica onde
 * essa duvida se resolve — o resto do codigo trata tudo como number.
 */
export function toCents(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed);
}
