import { expect, test } from "@playwright/test";

/**
 * Spec 009 (PWA) — critérios só de leitura, seguros para rodar em todo CI contra a produção:
 * manifest servido sem login (CA1), service worker ativo sem Cache Storage (CA-seg) e os critérios
 * de instalação do Chrome. O teste offline (CA6) precisa de sessão e mora no projeto `probe`
 * (simulation.spec.ts), junto com a sonda da spec 012.
 */

test("manifest é servido sem login, com o tipo certo e os campos da spec 009", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/manifest+json");

  const manifest = (await response.json()) as Record<string, unknown>;
  expect(manifest).toMatchObject({
    name: "Velos Wallet",
    short_name: "Velos",
    lang: "pt-BR",
    start_url: "/painel",
    scope: "/",
    display: "standalone",
    background_color: "#0A2E24",
    theme_color: "#0A2E24",
  });

  const icons = manifest.icons as Array<Record<string, string>>;
  expect(icons.some((icon) => icon.purpose === "maskable")).toBe(true);
  expect(icons.some((icon) => icon.sizes === "192x192")).toBe(true);
  expect(icons.some((icon) => icon.sizes === "512x512")).toBe(true);
});

test("sw.js é servido como JavaScript e os ícones do manifest existem", async ({ request }) => {
  const sw = await request.get("/sw.js");
  expect(sw.status()).toBe(200);
  expect(sw.headers()["content-type"]).toContain("javascript");

  for (const path of [
    "/icons/icon-192.png",
    "/icons/icon-512.png",
    "/icons/icon-maskable-512.png",
    "/icons/apple-touch-icon.png",
  ]) {
    const icon = await request.get(path);
    expect(icon.status(), `ícone ${path}`).toBe(200);
    expect(icon.headers()["content-type"]).toContain("image/png");
  }
});

test("service worker registra e ativa sem guardar nada em Cache Storage (CA-seg)", async ({ page }) => {
  await page.goto("/");

  // O sw.js faz skipWaiting + clients.claim: a página passa a ser controlada logo depois do load.
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null), {
      message: "a página devia estar controlada pelo service worker",
      timeout: 30_000,
    })
    .toBe(true);

  const state = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    return { active: registration.active?.state ?? null, cacheKeys: await caches.keys() };
  });
  expect(state.active).toBe("activated");
  expect(state.cacheKeys).toEqual([]);
});

test("o Chrome considera o app instalável (manifest + fetch handler)", async ({ page, context }) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);

  // Page.getInstallabilityErrors: lista vazia = critérios do Chrome atendidos (manifest, SW com
  // fetch handler, HTTPS). Não depende de engajamento do usuário, só dos requisitos técnicos.
  const cdp = await context.newCDPSession(page);
  const { installabilityErrors } = (await cdp.send("Page.getInstallabilityErrors")) as unknown as {
    installabilityErrors: Array<{ errorId: string; errorArguments: unknown[] }>;
  };
  expect(installabilityErrors).toEqual([]);
});
