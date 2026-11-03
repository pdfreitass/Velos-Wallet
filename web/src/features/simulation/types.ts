/**
 * A base de uma categoria para a simulação (spec 012), como a API entrega.
 * `categoryId` nulo é "Sem categoria" (RN9), como no Início.
 */
export type CategoryAverage = {
  categoryId: string | null;
  name: string | null;
  color: string | null;
  icon: string | null;
  /**
   * Em quantos meses da janela esta categoria teve despesa — o que a tela diz quando a média se
   * apoia em pouco dado (RN5). Não é o tamanho da janela.
   */
  monthsCounted: number;
  /** Média mensal em centavos, somada e arredondada no banco. */
  averageCents: number;
};

/** `GET /api/simulation/base`. */
export type SimulationBase = {
  /** Tamanho da janela considerada (RN1). */
  windowMonths: number;
  /** Vazia quando não há nenhum mês completo com despesa: o estado de dados insuficientes (RN4). */
  categories: CategoryAverage[];
};

/** RN7: cortar 0% não é pergunta; cortar tudo é a pergunta original da ideia. */
export const MIN_PERCENT = 1;
export const MAX_PERCENT = 100;

/** Os atalhos da tela. O percentual livre aceita qualquer inteiro da faixa. */
export const PRESET_PERCENTS = [10, 20, 30] as const;

/** RN5: abaixo disto, a tela avisa em quantos meses a média se apoia. */
export const FEW_MONTHS = 3;

/** O Select reserva o `null` para "nada escolhido", então "Sem categoria" precisa de chave própria. */
const NO_CATEGORY = "sem-categoria";

export function categoryKey(category: CategoryAverage): string {
  return category.categoryId ?? NO_CATEGORY;
}
