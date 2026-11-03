import { QueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/client";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Só tenta de novo quando a falha pode ser passageira (rede ou 5xx); 4xx é resposta definitiva.
      retry: (failureCount, error) =>
        failureCount < 2 && error instanceof ApiError && (error.status === 0 || error.status >= 500),
      refetchOnWindowFocus: false,
      // CA6 da spec 009: sem internet, a query TEM de falhar e mostrar o estado de erro ("Tentar de
      // novo"). O padrão "online" pausa a query para sempre (skeleton eterno), o que esconderia o
      // problema do usuário e ainda deixaria saldo antigo na tela como se fosse atual (RN1).
      networkMode: "always",
    },
    mutations: {
      // Mesma lógica do CA6 para salvar sem internet: a mutação falha logo e mostra o erro,
      // em vez de ficar em "Salvando…" para sempre.
      networkMode: "always",
    },
  },
});
