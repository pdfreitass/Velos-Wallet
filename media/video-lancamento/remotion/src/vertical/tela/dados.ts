/**
 * Os mesmos dados ilustrativos de `web/src/features/showcase/showcase-data.ts`, copiados para o
 * vídeo. Valores em centavos, como manda o projeto — nada de float para dinheiro.
 *
 * São números de exemplo, não de ninguém: toda tela que os mostra traz o selo "Exemplo".
 * Se mudarem no app, mudar aqui também.
 */

export type Conta = { nome: string; tipo: string; icone: string; centavos: number };

/** Contas que entram no saldo total. */
export const contasAtivo: Conta[] = [
  { nome: "Conta corrente", tipo: "Banco", icone: "landmark", centavos: 235_000 },
  { nome: "Poupança", tipo: "Reserva", icone: "piggy-bank", centavos: 812_045 },
  { nome: "Dinheiro", tipo: "Na carteira", icone: "banknote", centavos: 18_000 },
];

/** O cartão fica fora do saldo e aparece como dívida (ADR 0007). */
export const contaCartao: Conta = {
  nome: "Cartão de crédito",
  tipo: "Fora do saldo",
  icone: "credit-card",
  centavos: 64_090,
};

/** 235.000 + 812.045 + 18.000 */
export const saldoTotalCentavos = 1_065_045;

export type Lancamento = {
  titulo: string;
  categoria: string;
  icone: string;
  centavos: number;
  sentido: "in" | "out";
};

export const entradasMesCentavos = 420_000;
export const saidasMesCentavos = 261_840;
/** 420.000 − 261.840 */
export const sobrouMesCentavos = 158_160;
/** Saídas ÷ entradas, para a largura da barra. */
export const participacaoSaidas = 62.3;

export const lancamentosRecentes: Lancamento[] = [
  { titulo: "Salário", categoria: "Salário", icone: "wallet", centavos: 420_000, sentido: "in" },
  { titulo: "Aluguel", categoria: "Moradia", icone: "house", centavos: 145_000, sentido: "out" },
  { titulo: "Mercado", categoria: "Alimentação", icone: "utensils-crossed", centavos: 38_640, sentido: "out" },
  { titulo: "Uber", categoria: "Transporte", icone: "car", centavos: 3_290, sentido: "out" },
];

export type Categoria = {
  nome: string;
  icone: string;
  /** Cor padrão da categoria, a mesma do seed do banco (migration 0003). */
  cor: string;
  centavos: number;
  fatia: number;
};

/** Soma 261.840 (= saidasMesCentavos). */
export const gastosPorCategoria: Categoria[] = [
  { nome: "Moradia", icone: "house", cor: "#4F8DF7", centavos: 145_000, fatia: 55.4 },
  { nome: "Alimentação", icone: "utensils-crossed", cor: "#E8833A", centavos: 61_240, fatia: 23.4 },
  { nome: "Transporte", icone: "car", cor: "#7C5CF5", centavos: 24_800, fatia: 9.5 },
  { nome: "Lazer", icone: "gamepad-2", cor: "#D94FA8", centavos: 18_000, fatia: 6.9 },
  { nome: "Outros", icone: "circle-dashed", cor: "#6B8075", centavos: 12_800, fatia: 4.8 },
];

export type Meta = {
  nome: string;
  icone: string;
  guardadoCentavos: number;
  alvoCentavos: number;
  percentagem: number;
};

export const metas: Meta[] = [
  { nome: "Viagem para Salvador", icone: "plane", guardadoCentavos: 310_000, alvoCentavos: 500_000, percentagem: 62 },
  { nome: "Reserva de emergência", icone: "umbrella", guardadoCentavos: 125_000, alvoCentavos: 600_000, percentagem: 21 },
  { nome: "Notebook novo", icone: "laptop", guardadoCentavos: 90_000, alvoCentavos: 450_000, percentagem: 20 },
];

/** 310.000 + 125.000 + 90.000 */
export const guardadoNasMetasCentavos = 525_000;

/**
 * Formato brasileiro, como `web/src/lib/utils/currency.ts`: ponto no milhar, vírgula no decimal.
 * Recebe centavos inteiros — nunca float.
 */
export function formatarMoeda(centavos: number): string {
  const inteiros = Math.floor(Math.abs(centavos) / 100);
  const resto = Math.abs(centavos) % 100;
  const milhar = inteiros.toLocaleString("pt-BR");
  return `R$ ${milhar},${String(resto).padStart(2, "0")}`;
}

/** Com sinal explícito: a cor nunca é a única pista (regra de acessibilidade do projeto). */
export function formatarMoedaComSinal(centavos: number, sentido: "in" | "out"): string {
  return `${sentido === "in" ? "+" : "−"}${formatarMoeda(centavos)}`;
}
