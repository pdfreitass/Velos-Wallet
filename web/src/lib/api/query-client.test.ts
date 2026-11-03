import { describe, expect, it } from "vitest";

import { queryClient } from "./query-client";

/**
 * CA6 da spec 009: sem internet, a query tem de falhar e mostrar o estado de erro ("Tentar de
 * novo"), nunca ficar presa no skeleton. O padrão do TanStack Query ("online") pausa a query
 * quando `navigator.onLine` é falso — este teste prende a correção no lugar.
 */
describe("queryClient (CA6 da spec 009)", () => {
  it("não pausa queries nem mutações quando o navegador fica offline", () => {
    expect(queryClient.getDefaultOptions().queries?.networkMode).toBe("always");
    expect(queryClient.getDefaultOptions().mutations?.networkMode).toBe("always");
  });
});
