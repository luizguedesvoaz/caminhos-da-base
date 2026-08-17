import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/", "/entrar", "/cadastro", "/privacidade", "/termos"];

export async function proxy(request: NextRequest) {
  /**
   * BUG CORRIGIDO (o "ciclo eterno de login"): pré-carregamento derrubava a sessão.
   *
   * O Next.js busca as telas em segundo plano antes do clique, para a navegação
   * parecer instantânea. Cada uma dessas buscas passava por aqui e chamava
   * `getUser()`, que renova o token quando ele está vencido — e o Supabase
   * ROTACIONA o token de renovação a cada uso, invalidando o anterior.
   *
   * Com várias buscas simultâneas, só a primeira renovação valia: as demais
   * recebiam "token inválido" e, pior, a última resposta a chegar gravava no
   * navegador um token já morto. A sessão morria sozinha, sem ninguém tocar
   * em nada.
   *
   * Além disso, quando um pré-carregamento era redirecionado para /entrar, o
   * Next guardava esse redirecionamento no cache do roteador. O clique seguinte
   * nem consultava o servidor: ia direto para o login. Era exatamente o sintoma
   * observado — digitar /documentos na barra de endereço funcionava, clicar no
   * link da mesma tela não.
   *
   * Pré-carregamento não é navegação de gente: não precisa de verificação de
   * acesso, e portanto sai daqui sem tocar na sessão. A proteção real dos dados
   * nunca dependeu desta função — está nas políticas RLS do banco, que valem
   * para qualquer requisição.
   */
  if (request.headers.get("next-router-prefetch") === "1") {
    return NextResponse.next({ request });
  }

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_ROUTES.includes(path);

  /**
   * Redirecionamento que carrega consigo os cookies de sessão recém-renovados.
   * Sem isso, criar uma resposta nova descartava o token novo e o navegador
   * ficava com o antigo, já invalidado pela rotação.
   *
   * O cabeçalho `no-store` impede que navegador e CDN guardem o desvio para o
   * login: um redirecionamento de autenticação em cache prende o usuário fora
   * do app mesmo depois de a sessão voltar a valer.
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
    redirect.headers.set("Cache-Control", "no-store, must-revalidate");
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
