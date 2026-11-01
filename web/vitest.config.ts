import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * Testes das funções puras (dinheiro, datas, validações). Ambiente `node`: sem jsdom, porque
 * ainda não há componente para testar (spec 004). O fuso é fixado em globalSetup.
 */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    globalSetup: ["./vitest.global-setup.ts"],
  },
});
