import { expect, type Page } from "@playwright/test";

/**
 * Passos de UI compartilhados pelas sondas E2E (spec 012 e CA6 da spec 009). Código em inglês,
 * textos da interface em português, como o resto do projeto.
 */

/** Uma conta descartável por execução. A senha cumpre a política dos dois lados. */
export function probeCredentials() {
  const stamp = Date.now().toString(36);
  return {
    name: `Sonda E2E ${stamp}`,
    email: `e2e-probe-${stamp}@example.com`,
    password: "Velos-E2E-Sonda-123!",
  };
}

export type ProbeCredentials = ReturnType<typeof probeCredentials>;

/** Cadastro real. A confirmação de email está desligada (C1 pendente), então entra direto no painel. */
export async function signUp(page: Page, credentials: ProbeCredentials) {
  await page.goto("/cadastro");
  await page.getByLabel("Nome", { exact: true }).fill(credentials.name);
  await page.getByLabel("Email", { exact: true }).fill(credentials.email);
  await page.getByLabel("Senha", { exact: true }).fill(credentials.password);
  await page.getByLabel("Confirmar senha", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page).toHaveURL(/\/painel/, { timeout: 30_000 });
}

/** Conta (banco) nova, do tipo padrão. O saldo inicial já nasce zerado. */
export async function createBankAccount(page: Page, name: string) {
  await page.goto("/contas/nova");
  await page.getByRole("radio", { name: /conta corrente/i }).check();
  await page.getByLabel("Nome", { exact: true }).fill(name);
  await page.getByRole("button", { name: "Salvar conta", exact: true }).click();
  await expect(page).toHaveURL(/\/contas$/);
}

/** Categoria de despesa nova. */
export async function createExpenseCategory(page: Page, name: string) {
  await page.goto("/categorias/nova");
  await page.getByRole("radio", { name: /despesa/i }).check();
  await page.getByLabel("Nome", { exact: true }).fill(name);
  await page.getByRole("button", { name: "Salvar categoria", exact: true }).click();
  // `/categorias` (sem `/nova`) + a linha na lista: prova que salvou de verdade.
  await expect(page).toHaveURL(/\/categorias\?tipo=despesas/);
  await expect(page.getByRole("link", { name: new RegExp(name) })).toBeVisible();
}

/** Despesa no dia 15 do mês anterior (um mês completo, como a janela da simulação quer). */
export async function createExpenseOnPreviousMonth(page: Page, category: string, amount: string) {
  await page.goto("/transacoes/nova");
  await page.getByLabel("Valor", { exact: true }).fill(amount);
  await page.getByRole("button", { name: new RegExp(category) }).click();
  await pickDateOnPreviousMonth(page);
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page).toHaveURL(/\/transacoes\?mes=\d{4}-\d{2}/);
}

/**
 * O campo de data abre um calendário no mês corrente (São Paulo). Volta um mês e escolhe o dia 15 —
 * no mês anterior, o "15" aparece uma única vez na grade, mesmo com os dias dos meses vizinhos.
 */
export async function pickDateOnPreviousMonth(page: Page) {
  await page.getByRole("button", { name: "Data", exact: true }).click();
  const popup = page.locator('[aria-label="Escolher data"]');
  await popup.getByRole("button", { name: /anterior/i }).click();
  await popup.locator('[role="gridcell"] button').filter({ hasText: /^15$/ }).click();
}

/** RN11: excluir a categoria deixa as movimentações como "Sem categoria". */
export async function deleteCategory(page: Page, name: string) {
  await page.goto("/categorias");
  await page.getByRole("link", { name: new RegExp(name) }).click();
  await expect(page).toHaveURL(/\/categorias\/[0-9a-f-]+/);
  await page.getByRole("button", { name: "Excluir categoria", exact: true }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog.getByText(/passa a aparecer como|passam a aparecer como/)).toBeVisible();
  await dialog.getByRole("button", { name: "Excluir categoria", exact: true }).click();
  await expect(page).toHaveURL(/\/categorias/);
}

/** Limpeza da sonda: excluir a conta apaga também as movimentações dela (RN6 da spec 002). */
export async function deleteBankAccountWithMovements(page: Page, name: string) {
  await page.goto("/contas");
  await page.getByRole("link", { name: new RegExp(name) }).click();
  await expect(page).toHaveURL(/\/contas\/[0-9a-f-]+/);
  await page.getByRole("button", { name: "Excluir conta", exact: true }).click();
  const dialog = page.getByRole("alertdialog");
  await dialog.getByText("Entendi que isso não pode ser desfeito").click();
  await dialog.getByRole("button", { name: /Excluir conta e \d+ movimenta/ }).click();
  await expect(page).toHaveURL(/\/contas$/);
}
