import { cn } from "cn";
import { CircleAlert } from "lucide-react";
import { Link, useSearchParams } from "react-router";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/auth/routes";

/**
 * Erro de autenticação que acontece FORA do app e volta como navegação (T20): cancelar no Google,
 * provedor recusando, código que não serve. Como o usuário chega aqui por um 302 da API, a tela
 * não tem formulário — só explica e oferece a saída.
 */
const REASONS = {
  google: {
    title: "Não foi possível entrar com o Google",
    description:
      "O login pode ter sido cancelado ou recusado. Tente de novo ou entre com seu email e senha.",
  },
  default: {
    title: "Não foi possível concluir a autenticação",
    description: "Tente novamente. Se continuar, entre com seu email e senha.",
  },
} as const;

export function AuthErrorPage() {
  const [params] = useSearchParams();
  const reason = params.get("motivo");
  const { title, description } = reason === "google" ? REASONS.google : REASONS.default;

  return (
    <>
      <title>Erro na autenticação · Velos Wallet</title>

      <div className="space-y-6">
        <div className="space-y-2">
          <CircleAlert className="size-8 text-destructive" aria-hidden="true" />
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>

        <div className="space-y-3">
          <Link to={ROUTES.signIn} className={cn(buttonVariants(), "h-11 w-full text-base")}>
            Voltar para entrar
          </Link>
          <Link
            to={ROUTES.signUp}
            className={cn(buttonVariants({ variant: "outline" }), "h-11 w-full border-input text-base")}
          >
            Criar conta
          </Link>
        </div>
      </div>
    </>
  );
}
