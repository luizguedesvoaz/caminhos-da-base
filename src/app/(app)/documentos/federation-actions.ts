"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type RegistrationState = { error?: string; ok?: boolean };

export async function saveRegistration(
  _prev: RegistrationState,
  formData: FormData,
): Promise<RegistrationState> {
  const athleteId = String(formData.get("athleteId") ?? "");
  const seasonYear = Number(formData.get("seasonYear") ?? 0);
  const federation = String(formData.get("federation") ?? "").trim();
  const clubName = String(formData.get("clubName") ?? "").trim();
  const registeredOn = String(formData.get("registeredOn") ?? "").trim();
  const windowEndsOn = String(formData.get("windowEndsOn") ?? "").trim();

  if (!athleteId) return { error: "Nenhum atleta selecionado." };
  if (!federation) return { error: "Informe a federação." };
  if (!clubName) return { error: "Informe o clube que fez a inscrição." };
  if (!Number.isInteger(seasonYear) || seasonYear < 2000) {
    return { error: "Temporada inválida." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("federation_registrations").insert({
    athlete_id: athleteId,
    federation: federation.toUpperCase(),
    club_name: clubName,
    season_year: seasonYear,
    registered_on: registeredOn || null,
    transfer_window_ends_on: windowEndsOn || null,
  });

  if (error) {
    if (/row-level security/i.test(error.message)) {
      return { error: "Sem permissão para registrar o vínculo deste atleta." };
    }
    return { error: `Erro do banco: ${error.message}` };
  }

  revalidatePath("/documentos");
  revalidatePath("/inicio");
  return { ok: true };
}
