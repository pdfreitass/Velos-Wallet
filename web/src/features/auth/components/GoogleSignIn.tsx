import { cn } from "cn";

import { GoogleIcon } from "@/components/brand/GoogleIcon";
import { buttonVariants } from "@/components/ui/button";

/**
 * "ou" + "Continuar com Google". Navegação de página inteira: a API monta o PKCE e redireciona
 * para o Google (endpoint /api/auth/google, task T20 da spec 001).
 */
export function GoogleSignIn({ next }: { next: string }) {
  return (
    <>
      <div className="flex items-center gap-3 text-sm text-muted-foreground" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        ou
        <span className="h-px flex-1 bg-border" />
      </div>
      <a
        href={`/api/auth/google?next=${encodeURIComponent(next)}`}
        className={cn(buttonVariants({ variant: "outline" }), "h-11 w-full gap-2.5 text-base")}
      >
        <GoogleIcon className="size-5" />
        Continuar com Google
      </a>
    </>
  );
}
