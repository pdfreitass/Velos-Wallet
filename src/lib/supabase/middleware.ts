import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { ROUTES, isGuestOnlyRoute, isPublicRoute } from "@/lib/auth/routes";
import { env } from "@/lib/env";
import type { Database } from "@/types/database.types";

/**
 * Corre em toda a request: renova a sessao e decide o acesso (spec 001, RN8).
 *
 * O app e PRIVADO POR PADRAO (ADR 0014): sem sessao, so passam as rotas de
 * `isPublicRoute`. Qualquer pagina nova ja nasce protegida.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

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

  // getUser() e nao getSession(): valida o token no servidor do Supabase em
  // vez de confiar no cookie. E tambem esta chamada que renova o token.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  if (pathname === "/") {
    return redirectKeepingCookies(request, response, user ? ROUTES.home : ROUTES.signIn);
  }

  if (isPublicRoute(pathname)) {
    if (user && isGuestOnlyRoute(pathname)) {
      return redirectKeepingCookies(request, response, ROUTES.home);
    }
    return response;
  }

  if (!user) {
    const signIn = new URL(ROUTES.signIn, request.url);
    signIn.searchParams.set("next", `${pathname}${search}`);
    return redirectKeepingCookies(request, response, signIn);
  }

  // Pagina privada: o browser nao a guarda em cache. Sem isto, o botao
  // "voltar" depois de sair mostraria a pagina antiga (spec 001, CA11).
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

/**
 * Redireciona levando os cookies que o Supabase acabou de renovar. Um
 * NextResponse.redirect novo perderia-os e a sessao "cairia" sem motivo.
 */
function redirectKeepingCookies(
  request: NextRequest,
  from: NextResponse,
  to: string | URL,
) {
  const redirect = NextResponse.redirect(new URL(to, request.url));
  for (const cookie of from.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  return redirect;
}
