import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/", "/entrar", "/cadastro", "/privacidade", "/termos"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Revalida a sessão. Não remover: mantém o token atualizado a cada request.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_ROUTES.includes(path);

  /**
   * Transfere para o redirecionamento os cookies de sessão que o Supabase
   * acabou de renovar.
   *
   * BUG CORRIGIDO (onda 3): antes, um redirecionamento criava uma resposta
   * nova e descartava esses cookies. Quando o token de acesso expirava, o
   * Supabase rotacionava o token de renovação e invalidava o antigo — mas o
   * novo era jogado fora junto com a resposta. O navegador ficava segurando
   * um token já morto, toda requisição seguinte falhava, e o app entrava em
   * ciclo eterno de login. Era exatamente o sintoma relatado na tela de
   * documentos: cair em /entrar e a tela de login não devolver para dentro.
   */
  function redirectPreservingSession(pathname: string, keepNext = false) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    if (keepNext) url.searchParams.set("proximo", path);
    else url.search = "";

    const redirect = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) {
      redirect.cookies.set(cookie);
    }
    return redirect;
  }

  if (!user && !isPublic) {
    return redirectPreservingSession("/entrar", true);
  }

  if (user && (path === "/entrar" || path === "/cadastro")) {
    return redirectPreservingSession("/inicio");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.png$|.*\\.svg$).*)"],
};
