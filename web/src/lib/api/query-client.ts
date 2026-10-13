import { QueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/client";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Só tenta de novo quando a falha pode ser passageira (rede ou 5xx); 4xx é resposta definitiva.
      retry: (failureCount, error) =>
        failureCount < 2 && error instanceof ApiError && (error.status === 0 || error.status >= 500),
      refetchOnWindowFocus: false,
    },
  },
});
