import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type {
  ForgotPasswordInput,
  ResetPasswordInput,
  SignInInput,
  SignUpInput,
} from "@/lib/validations/auth";

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

/**
 * "Esqueci minha senha" (RN6). A API responde 202 tanto para email com conta quanto sem (RN4),
 * então a tela mostra o mesmo texto nos dois casos — não há o que o front possa distinguir.
 */
export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) =>
      api("/api/auth/password-reset", { method: "POST", body: input }),
  });
}

/** Senha nova. Só passa com o cookie de recuperação que a volta do email deixou (CA7). */
export function useChangePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ResetPasswordInput) => api("/api/auth/password", { method: "PUT", body: input }),
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
