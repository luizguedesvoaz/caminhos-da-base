import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ACTIVE_COOKIE = "atleta_ativo";

export type AthleteRow = {
  id: string;
  full_name: string;
  birth_year: number;
  position: string | null;
  current_club_name: string | null;
};

/**
 * Atleta em foco na navegação.
 *
 * Um responsável pode ter mais de um filho, mas a maioria tem um só. Guardamos
 * a escolha num cookie em vez de colocar o id na URL: as rotas ficam curtas
 * (/tarefas em vez de /atleta/uuid/tarefas) e o pai não vê identificadores
 * estranhos no navegador. Se o cookie apontar para um atleta ao qual o usuário
 * perdeu acesso, a RLS simplesmente não o devolve e caímos no primeiro da lista.
 */
export async function getAthletes(): Promise<AthleteRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("athletes")
    .select("id, full_name, birth_year, position, current_club_name")
    .is("deleted_at", null)
    .order("created_at");
  return data ?? [];
}

export async function getActiveAthlete(): Promise<{
  athlete: AthleteRow;
  all: AthleteRow[];
}> {
  const all = await getAthletes();
  if (all.length === 0) redirect("/onboarding");

  const cookieStore = await cookies();
  const preferred = cookieStore.get(ACTIVE_COOKIE)?.value;
  const athlete = all.find((a) => a.id === preferred) ?? all[0];

  return { athlete, all };
}

export { ACTIVE_COOKIE };
