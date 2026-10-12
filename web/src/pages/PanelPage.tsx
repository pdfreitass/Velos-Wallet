import { LoaderCircle, LogOut } from "lucide-react";
import { useNavigate } from "react-router";

import { VelosMark } from "@/components/brand/VelosMark";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useCurrentUser, useSignOut } from "@/features/auth/api";
import { ROUTES } from "@/lib/auth/routes";

/**
 * Painel PROVISÓRIO da spec 001: prova o fluxo de login ("Olá, {nome}" + Sair).
 * O dashboard de verdade é a Etapa 6.
 */
export function PanelPage() {
  const navigate = useNavigate();
  const me = useCurrentUser();
  const signOut = useSignOut();
  const firstName = me.data?.name.split(" ")[0] ?? "";

  function handleSignOut() {
    signOut.mutate(undefined, { onSettled: () => navigate(ROUTES.signIn, { replace: true }) });
  }

  return (
    <div className="min-h-dvh">
      <title>Painel · Velos Wallet</title>
      <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-8">
        <div className="flex items-center gap-2">
          <VelosMark className="h-7 w-auto" />
          <span className="font-semibold tracking-tight">Velos Wallet</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={handleSignOut} disabled={signOut.isPending}>
            {signOut.isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <LogOut aria-hidden="true" />}
            Sair
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-8">
        <h1 className="text-3xl font-semibold tracking-tight">Olá, {firstName}</h1>
        <p className="mt-2 text-muted-foreground">
          Seu painel está sendo construído. Em breve você vê aqui seu saldo, seus gastos e suas metas.
        </p>
      </main>
    </div>
  );
}
