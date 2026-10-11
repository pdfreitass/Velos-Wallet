import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { env, hasSupabaseEnv } from "@/lib/env";
import type { Database } from "@/types/database.types";

/**
 * Renova o token de sessao a cada request e propaga os cookies atualizados.
 *
 * A protecao de rotas entra na Etapa 3 (autenticacao); aqui so se garante
 * que a sessao nao expira enquanto o utilizador navega.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Antes de o projeto Supabase existir (Etapa 1), deixa passar em vez de
  // rebentar em cada request. A partir da Etapa 3 as chaves sao obrigatorias.
  if (!hasSupabaseEnv()) {
    return response;
  }

  const supabase = createServerClient<Database>(
    env.supabaseUrl,
    env.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Obrigatorio: e esta chamada que dispara a renovacao do token.
  await supabase.auth.getUser();

  return response;
}
