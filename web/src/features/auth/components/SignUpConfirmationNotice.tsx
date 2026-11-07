import { MailCheck } from "lucide-react";
import { useSearchParams } from "react-router";

import { FormAlert } from "@/components/shared/FormAlert";

/**
 * Recado da volta de `/auth/confirmar-cadastro` (spec 013, RN9). São dois casos diferentes, e
 * misturá-los mandava quem confirmou num ciclo sem fim de "peça outro link":
 *
 * - `?aviso=confirmado` — o email FOI confirmado, mas a sessão não pôde ser criada neste
 *   navegador (cadastro no celular, link aberto no computador). Não é erro: é só entrar.
 * - `?erro=confirmacao` — o link não valeu (velho ou já usado). Aí sim, pedir outro.
 */
export function SignUpConfirmationNotice() {
  const [params] = useSearchParams();

  if (params.get("aviso") === "confirmado") {
    return (
      // role="status" (e não "alert"): é uma boa notícia, não um problema.
      <div role="status" className="flex gap-3 rounded-lg border border-primary/40 bg-primary/8 p-3 text-sm">
        <MailCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <p>Seu email foi confirmado. É só entrar.</p>
      </div>
    );
  }

  if (params.get("erro") === "confirmacao") {
    return <FormAlert message="Este link não é mais válido. Peça outro." />;
  }

  return null;
}
