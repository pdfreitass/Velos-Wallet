import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Passos de UI compartilhados pelas sondas E2E (spec 012 e CA6 da spec 009). Código em inglês,
 * textos da interface em português, como o resto do projeto.
 */

/**
 * Entra com a conta da sonda (T6 da spec 013). A sonda cadastrava uma conta descartável por
 * execução, mas desde que a confirmação de email voltou o cadastro **não dá sessão**: o caminho
 * passa por um link no email, que o Playwright não lê. Então a sonda usa uma conta JÁ confirmada.
 *
 * As credenciais vêm do ambiente e nunca do repositório. A conta tem de ser **dedicada à sonda**
 * e ficar **vazia** entre execuções: o roteiro conta com uma única despesa na janela da simulação.
 * De quebra, acabam os usuários órfãos que cada execução deixava em produção.
 */
export async function signInExisting(page: Page) {
  const email = requireEnv("E2E_EMAIL");
  const password = requireEnv("E2E_PASSWORD");

  await page.goto("/entrar");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/painel/, { timeout: 30_000 });
}

/** Falta de credencial é erro de configuração: dizer o que fazer, em vez de falhar num seletor. */
function requireEnv(name: string) {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") {
    throw new Error(
      `O projeto "probe" precisa de ${name}. Defina E2E_EMAIL e E2E_PASSWORD com uma conta ` +
        "já confirmada e dedicada à sonda (sem dados próprios) antes de rodar.",
    );
  }
  return value;
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

/**
 * Limpeza tolerante (T6 da spec 013): a conta da sonda é reutilizada, então a limpeza roda sempre
 * — inclusive quando a execução morreu antes de criar a categoria. Nada a apagar não é erro.
 */
export async function deleteCategoryIfPresent(page: Page, name: string) {
  await page.goto("/categorias");
  const empty = page.getByRole("heading", { name: /Nenhuma categoria de/ });
  if (await isAbsent(page.getByRole("link", { name: new RegExp(name) }), empty)) return;
  await deleteCategory(page, name);
}

/** Igual à de cima, para a conta (banco) da sonda. */
export async function deleteBankAccountIfPresent(page: Page, name: string) {
  await page.goto("/contas");
  if (await isAbsent(page.getByRole("link", { name: new RegExp(name) }), emptyAccounts(page))) return;
  await deleteBankAccountWithMovements(page, name);
}

/**
 * Pré-condição da sonda: a conta de usuário tem de estar vazia. O roteiro conta com UMA despesa
 * na janela da simulação, então dado de outra origem (ou resto de uma execução anterior) daria
 * número errado no CA9 — e um erro difícil de ler. Falhar aqui diz o que está errado.
 */
export async function expectEmptyProbeAccount(page: Page) {
  await page.goto("/contas");
  await expect(
    emptyAccounts(page),
    "A conta da sonda (E2E_EMAIL) tem de estar vazia: apague o que sobrou antes de rodar.",
  ).toBeVisible();
}

function emptyAccounts(page: Page) {
  return page.getByRole("heading", { name: "Você ainda não tem contas" });
}

/**
 * `count()` não espera. Esperar o esqueleto sumir não basta: a lista pode nem ter montado, ou ter
 * caído no estado de erro, e aí "zero" significaria "não carregou" em vez de "não existe" — e a
 * limpeza passaria batida. Por isso esperamos um estado POSITIVO: ou a linha procurada, ou a
 * lista vazia reconhecível.
 */
async function isAbsent(locator: Locator, whenEmpty: Locator) {
  await expect(locator.or(whenEmpty).first()).toBeVisible();
  return (await locator.count()) === 0;
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
