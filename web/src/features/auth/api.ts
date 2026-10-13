import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { SignInInput, SignUpInput } from "@/lib/validations/auth";

export type CurrentUser = {
  name: string;
  email: string | null;
};

const meKey = ["me"] as const;

/** Usuário logado. 401 = sem sessão (quem decide é a API; o front só reage). */
export function useCurrentUser() {
  return useQuery({
    queryKey: meKey,
    queryFn: ({ signal }) => api<CurrentUser>("/api/me", { signal }),
    retry: false,
    staleTime: 5 * 60_000,
  });
}

export function useSignIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SignInInput) => api("/api/auth/sign-in", { method: "POST", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: meKey }),
  });
}

export function useSignUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SignUpInput) => api("/api/auth/sign-up", { method: "POST", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: meKey }),
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api("/api/auth/sign-out", { method: "POST" }),
    // CA11: nada da sessão anterior fica em memória (o "voltar" do navegador pede login de novo).
    onSettled: () => queryClient.clear(),
  });
}
