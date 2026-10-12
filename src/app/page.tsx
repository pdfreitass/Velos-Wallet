import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";

/**
 * "/" nao tem conteudo proprio: leva ao painel ou a entrada (spec 001, RN8).
 * O middleware ja faz este redirecionamento; aqui fica a segunda barreira.
 */
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? ROUTES.home : ROUTES.signIn);
}
