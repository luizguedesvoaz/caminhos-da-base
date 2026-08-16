"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { youtubeId } from "@/lib/domain/season";

export type MatchState = { error?: string; ok?: boolean };

export async function createMatch(
  _prev: MatchState,
  formData: FormData,
): Promise<MatchState> {
  const athleteId = String(formData.get("athleteId") ?? "");
  const playedOn = String(formData.get("playedOn") ?? "");
  const opponent = String(formData.get("opponent") ?? "").trim();
  const competition = String(formData.get("competition") ?? "").trim();
  const rawMinutes = String(formData.get("minutes") ?? "").trim();
  const videoUrl = String(formData.get("videoUrl") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!athleteId) return { error: "Nenhum atleta selecionado." };
  if (!playedOn) return { error: "Informe a data do jogo." };

  const minutes = rawMinutes === "" ? null : Number(rawMinutes);
  if (minutes !== null && (!Number.isInteger(minutes) || minutes < 0 || minutes > 120)) {
    return { error: "Minutos precisam ser um número entre 0 e 120." };
  }

  const goals = Number(formData.get("goals") ?? 0);
  const assists = Number(formData.get("assists") ?? 0);
  if (!Number.isInteger(goals) || goals < 0 || !Number.isInteger(assists) || assists < 0) {
    return { error: "Gols e assistências precisam ser números inteiros." };
  }

  // Aceita qualquer link, mas avisa quando não é YouTube — o app monta o
  // player embutido apenas para YouTube.
  if (videoUrl && !/^https?:\/\//i.test(videoUrl)) {
    return { error: "O link do vídeo precisa começar com http:// ou https://" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("matches").insert({
    athlete_id: athleteId,
    season_year: Number(playedOn.slice(0, 4)),
    played_on: playedOn,
    opponent: opponent || null,
    competition_name: competition || null,
    minutes_played: minutes,
    goals,
    assists,
    video_url: videoUrl || null,
    notes: notes || null,
  });

  if (error) {
    if (/row-level security/i.test(error.message)) {
      return { error: "Sem permissão para registrar jogos deste atleta." };
    }
    return { error: `Erro do banco: ${error.message}` };
  }

  revalidatePath("/temporada");
  return { ok: true };
}

export async function deleteMatch(matchId: string) {
  const supabase = await createClient();
  await supabase
    .from("matches")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", matchId);
  revalidatePath("/temporada");
}

export { youtubeId };
