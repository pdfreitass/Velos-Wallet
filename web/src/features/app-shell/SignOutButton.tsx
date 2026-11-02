import { LoaderCircle, LogOut } from "lucide-react";
import { useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { useSignOut } from "@/features/auth/api";
import { ROUTES } from "@/lib/auth/routes";

/** `iconOnly`: cabeçalho do celular (só o ícone, com rótulo acessível). Sem ele: menu lateral. */
export function SignOutButton({ iconOnly = false }: { iconOnly?: boolean }) {
  const navigate = useNavigate();
  const signOut = useSignOut();

  function handleSignOut() {
    signOut.mutate(undefined, { onSettled: () => navigate(ROUTES.signIn, { replace: true }) });
  }

  const icon = signOut.isPending ? (
    <LoaderCircle className="animate-spin" aria-hidden="true" />
  ) : (
    <LogOut aria-hidden="true" />
  );

  if (iconOnly) {
    return (
      <Button variant="ghost" size="icon" onClick={handleSignOut} disabled={signOut.isPending} aria-label="Sair">
        {icon}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      onClick={handleSignOut}
      disabled={signOut.isPending}
      className="w-full justify-start gap-3 px-3 text-base font-medium text-muted-foreground hover:text-foreground [&_svg:not([class*='size-'])]:size-5"
    >
      {icon}
      Sair
    </Button>
  );
}
