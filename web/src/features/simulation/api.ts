import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";

import type { SimulationBase } from "./types";

const simulationKey = ["simulation", "base"] as const;

/**
 * Uma chamada ao abrir a tela e mais nenhuma (CA6): o corte é recalculado em memória sobre esta
 * base enquanto a pessoa move o percentual.
 *
 * A base muda só quando entram transações de meses anteriores, o que é raro — mas não vale a pena
 * um `staleTime` próprio: a invalidação das mutações de dinheiro já cobre o caso.
 */
export function useSimulationBase() {
  return useQuery({
    queryKey: simulationKey,
    queryFn: ({ signal }) => api<SimulationBase>("/api/simulation/base", { signal }),
  });
}
