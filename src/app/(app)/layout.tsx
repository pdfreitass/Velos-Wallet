import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";

/**
 * Layout das rotas autenticadas.
 *
 * O middleware ja barra quem nao tem sessao; esta checagem e a segunda
 * barreira (defesa em profundidade, ADR 0014), para o caso de o matcher do
 * middleware deixar alguma rota de fora.
 */
export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.signIn);
  }

  return <>{children}</>;
}
