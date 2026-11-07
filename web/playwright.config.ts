import { defineConfig, devices } from "@playwright/test";

/**
 * E2E do Velos (ADR 0022). Dois projetos:
 *
 * - `readonly`: só leitura, seguro para rodar em todo CI contra a produção (spec 009: manifest,
 *   service worker, cache e instalabilidade).
 * - `probe`: entra numa conta **já confirmada e dedicada à sonda** (`E2E_EMAIL`/`E2E_PASSWORD`,
 *   do ambiente) e sonda dados reais (spec 012: CA9, aria-live estrutural) e o CA6 offline
 *   (spec 009). Rodar sob demanda — nunca no CI de rotina, porque escreve em produção. Desde a
 *   T6 da spec 013 **não cadastra mais** uma conta descartável por execução: com a confirmação
 *   de email ligada o cadastro não dá sessão, e cada execução deixava um usuário órfão. Os dados
 *   financeiros criados são apagados no fim, sempre (a conta é reutilizada).
 *
 * A base é a produção. Para outra origem (ex.: API local com user-secrets):
 *   E2E_BASE_URL=http://localhost:5080 npm run test:e2e
 */
const baseURL = process.env.E2E_BASE_URL ?? "https://veloswallet.com.br";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "readonly",
      testMatch: /pwa\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      // Mobile-first como as conferências manuais (375 px), tema claro.
      name: "probe",
      testMatch: /simulation\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 812 },
        colorScheme: "light",
      },
    },
  ],
});
