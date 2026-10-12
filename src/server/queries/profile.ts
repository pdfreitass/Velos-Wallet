import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export type CurrentProfile = {
  id: string;
  name: string;
  email: string | null;
};

/**
 * Perfil do utilizador logado, ou null sem sessao.
 *
 * `cache` deduplica as chamadas dentro da MESMA request (layout + pagina
 * pedem o perfil e o Supabase e consultado uma vez so).
 */
export const getCurrentProfile = cache(async (): Promise<CurrentProfile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name")
    .eq("id", user.id)
    .single();

  if (error) throw error;
  return { id: data.id, name: data.name, email: user.email ?? null };
});
