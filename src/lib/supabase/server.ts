import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { env } from "@/lib/env";
import type { Database } from "@/types/database.types";

/**
 * Client para Server Components, Server Actions e Route Handlers.
 *
 * E assincrono porque `cookies()` passou a ser assincrono no Next 15.
 * Criar um novo por request — nunca guardar em variavel de modulo, senao
 * a sessao de um utilizador vaza para outro.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components nao podem escrever cookies. Nao e um erro:
          // o middleware ja renovou a sessao antes de chegarmos aqui.
        }
      },
    },
  });
}
