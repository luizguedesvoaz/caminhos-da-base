"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Liga e desliga a apresentação do atleta a clubes e parceiros.
 *
 * A decisão fica com a família e é registrada no banco com data e autor —
 * num modelo opt-out, poder provar quando alguém pediu para sair é o que
 * protege o produto.
 */
export async function setScoutingVisible(
  athleteId: string,
  visible: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_scouting_visible", {
    p_athlete_id: athleteId,
    p_visible: visible,
  });

  if (error) return { ok: false, error: `Erro do banco: ${error.message}` };
  if (data !== true) {
    return { ok: false, error: "Sem permissão para alterar este atleta." };
  }

  revalidatePath("/perfil");
  return { ok: true };
}
