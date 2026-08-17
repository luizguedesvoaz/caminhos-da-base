import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Portão do painel — SÓ SERVIDOR.
 *
 * Vive separado de `consultant.ts` de propósito: aquele arquivo tem tipos e
 * funções de filtro usados pelo explorador de atletas, que roda no navegador.
 * Se as duas coisas ficassem juntas, o componente de busca arrastaria consigo
 * o cliente de servidor do Supabase e o build quebraria.
 *
 * A verificação real de permissão está no banco: toda função do painel checa
 * `is_consultant(auth.uid())` e devolve vazio para quem não é. Isto aqui é só
 * conveniência de navegação.
 */
export async function requireConsultant() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?proximo=/painel");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "consultor") redirect("/inicio");

  return { user, name: profile.full_name as string };
}
