import { expect, test, type Page } from "@playwright/test";

import {
  createBankAccount,
  createExpenseCategory,
  createExpenseOnPreviousMonth,
  deleteBankAccountIfPresent,
  deleteCategory,
  deleteCategoryIfPresent,
  expectEmptyProbeAccount,
  signInExisting,
} from "./helpers";

/**
 * Sonda E2E (projeto `probe`: dados reais em produção, nunca no CI de rotina).
 *
 * Roteiro: entra na conta da sonda (E2E_EMAIL/E2E_PASSWORD — desde a spec 013 o cadastro exige
 * confirmação por email, que o Playwright não lê) → conta (banco) e categoria de sonda → despesa
 * de R$ 120,00 no mês anterior → categoria excluída (as movimentações passam a "Sem categoria",
 * RN11) → CA9 da spec 012 na tela → parte estrutural do CA-a11y (aria-live) → CA6 offline da
 * spec 009 → limpeza.
 *
 * A conta é reutilizada entre execuções, então a limpeza roda no `finally`: um resto de uma
 * execução que morreu no meio quebraria a seguinte pelo nome repetido.
 */

const ACCOUNT_NAME = "Conta Sonda E2E";
const CATEGORY_NAME = "Sonda CA9 E2E";

test("CA9: 'Sem categoria' aparece e simula depois de excluir a categoria", async ({ page }) => {
  await signInExisting(page);
  await expectEmptyProbeAccount(page);
  try {
    await runProbe(page);
  } finally {
    await cleanUp(page);
  }
});

/**
 * Roda sempre, mesmo se uma expectativa falhar: a conta da sonda é reutilizada e tem de voltar
 * vazia. Um erro AQUI não pode esconder o erro da sonda, que é o que interessa — vira anotação.
 */
async function cleanUp(page: Page) {
  try {
    await page.context().setOffline(false);
    await deleteCategoryIfPresent(page, CATEGORY_NAME);
    await deleteBankAccountIfPresent(page, ACCOUNT_NAME);
  } catch (error) {
    test.info().annotations.push({
      type: "limpeza falhou",
      description: `Sobrou dado na conta da sonda; apagar à mão antes da próxima execução. ${String(error)}`,
    });
  }
}

async function runProbe(page: Page) {
  await createBankAccount(page, ACCOUNT_NAME);
  await createExpenseCategory(page, CATEGORY_NAME);
  await createExpenseOnPreviousMonth(page, CATEGORY_NAME, "120,00");

  await deleteCategory(page, CATEGORY_NAME);

  // CA9 (RN9): o rótulo é o mesmo do Início, e a média é simulável. A categoria sonda era a única
  // com despesa na janela, então a tela já abre nela.
  await page.goto("/simular");
  await expect(page.locator("#simulacao-categoria")).toContainText("Sem categoria");

  // 20% de R$ 120,00 = R$ 24,00 por mês; 6× e 12× do valor mensal já arredondado (RN6).
  const result = page.locator('[aria-live="polite"]');
  await expect(result).toContainText("+R$ 24,00");
  await expect(result).toContainText("sobrariam por mês");
  await expect(page.getByText("Em 6 meses")).toBeVisible();
  await expect(page.getByText("+R$ 144,00", { exact: true })).toBeVisible();
  await expect(page.getByText("+R$ 288,00", { exact: true })).toBeVisible();

  // Pouco dado é dito, não escondido (RN5): a média vem de um mês só.
  await expect(page.getByText(/Esta média vem de um mês só/)).toBeVisible();

  // CA-a11y, parte estrutural: a região ao vivo muda junto com o corte, sem ir à rede.
  await page.getByRole("button", { name: "30%", exact: true }).click();
  await expect(result).toContainText("+R$ 36,00");
  await expect(page.getByText("Se você cortasse 30% de Sem categoria")).toBeVisible();

  // O seletor lista a opção com o mesmo rótulo (círculo "?" e nome).
  await page.locator("#simulacao-categoria").click();
  await expect(page.getByRole("option", { name: /Sem categoria/ })).toBeVisible();
  await page.keyboard.press("Escape");

  await verifyOfflineErrorState(page);
}

/** CA6 da spec 009: sem internet, a casca continua e as telas mostram o estado de erro. */
async function verifyOfflineErrorState(page: Page) {
  await page.goto("/painel");
  await expect(page.getByText("Gastos por categoria")).toBeVisible();

  await page.context().setOffline(true);

  // Navegação SPA (a casca já está carregada); a query de transações falha → estado de erro.
  await page
    .getByRole("navigation", { name: "Navegação principal" })
    .getByRole("link", { name: "Transações" })
    .click();
  await expect(page.getByText("Não foi possível carregar as transações")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByRole("button", { name: "Tentar de novo" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeVisible();

  await page.context().setOffline(false);
  await page.getByRole("button", { name: "Tentar de novo" }).click();
  await expect(page.getByText("Não foi possível carregar as transações")).not.toBeVisible();
}
