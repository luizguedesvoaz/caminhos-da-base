"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { categoryFor, currentSeason } from "@/lib/domain/category";

const schema = z.object({
  fullName: z.string().trim().min(2, "Informe o nome do atleta."),
  birthYear: z.coerce
    .number()
    .int()
    .min(currentSeason() - 20, "Atleta acima da faixa atendida.")
    .max(currentSeason() - 5, "Atleta ainda muito novo para o app."),
  clubName: z.string().trim().optional(),
  clubKind: z
    .enum(["escolinha", "projeto_social", "clube", "clube_formador"])
    .optional(),
  position: z.string().trim().optional(),
  competitions: z.array(z.string()).optional(),
});

export type OnboardingState = { error?: string };

export async function createAthlete(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const parsed = schema.safeParse({
    fullName: formData.get("fullName"),
    birthYear: formData.get("birthYear"),
    clubName: formData.get("clubName") || undefined,
    clubKind: formData.get("clubKind") || undefined,
    position: formData.get("position") || undefined,
    competitions: formData.getAll("competitions").map(String),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const data = parsed.data;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/entrar");

  const season = currentSeason();

  // 1. Cria o atleta. Só nome e ano de nascimento são obrigatórios —
  //    onboarding curto é requisito de UX da especificação.
  const { data: athlete, error: athleteError } = await supabase
    .from("athletes")
    .insert({
      full_name: data.fullName,
      birth_year: data.birthYear,
      position: data.position ?? null,
      current_club_name: data.clubName ?? null,
      created_by: user.id,
    })
    .select("id")
    .single();

  // O motivo real do banco chega à tela. Na onda 1, uma mensagem genérica
  // escondeu um bug de RLS e custou uma investigação inteira.
  if (athleteError || !athlete) {
    return {
      error: athleteError
        ? `Não foi possível salvar: ${athleteError.message}`
        : "Não foi possível salvar o atleta.",
    };
  }

  // 2. Vincula o responsável.
  const { error: guardianError } = await supabase.from("guardianships").insert({
    athlete_id: athlete.id,
    user_id: user.id,
    is_primary: true,
  });
  if (guardianError) {
    return { error: `Erro ao vincular responsável: ${guardianError.message}` };
  }

  // 3. Abre a temporada corrente, com a categoria calculada pelo ANO
  //    de nascimento — nunca pela idade.
  await supabase.from("seasons").insert({
    athlete_id: athlete.id,
    year: season,
    category: categoryFor(data.birthYear, season),
    club_name: data.clubName ?? null,
  });

  // 4. Registra as competições disputadas — entrada da engine da pirâmide.
  const competitions = data.competitions?.filter(Boolean) ?? [];
  if (competitions.length > 0) {
    await supabase.from("athlete_competitions").insert(
      competitions.map((name) => ({
        athlete_id: athlete.id,
        competition_name: name,
        season_year: season,
      })),
    );
  }

  // 5. Calcula o degrau no servidor e grava no histórico.
  await supabase.rpc("refresh_pyramid", { p_athlete_id: athlete.id });

  redirect(`/onboarding/resultado?atleta=${athlete.id}`);
}
