/**
 * Última conta e última categoria (por tipo) usadas neste aparelho, para o lançamento rápido
 * (RN6 da spec 004). É só conveniência: nada sensível (são ids), e sem armazenamento (aba
 * anônima, site bloqueado) o formulário só não vem pré-preenchido.
 */

const ACCOUNT_KEY = "velos:last-account";
const categoryKey = (type: string) => `velos:last-category:${type}`;

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Sem armazenamento: segue sem lembrar.
  }
}

export const lastUsed = {
  account: () => read(ACCOUNT_KEY),
  category: (type: string) => read(categoryKey(type)),
  remember(accountId: string, type: string, categoryId: string | null) {
    write(ACCOUNT_KEY, accountId);
    if (categoryId) write(categoryKey(type), categoryId);
  },
};
