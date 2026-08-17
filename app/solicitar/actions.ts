"use server";

import { createClient } from "@/lib/supabase/server";
import { currentSeason } from "@/lib/domain/category";

export type AccessRequestState = { ok?: boolean; error?: string };

/**
 * Solicitação pública de acesso.
 *
 * Formulário aberto, sem conta — então precisa de cuidados que os formulários
 * internos não precisam: validação no banco, freio contra reenvio do mesmo
 * telefone e nenhuma leitura pública da tabela (são dados de contato de
 * terceiros, incluindo nome de criança).
 *
 * Reenvio duplicado responde sucesso em vez de erro: quem já pediu não precisa
 * saber que está na fila duas vezes, e a resposta não revela se um telefone
 * já está cadastrado.
 */
export async function submitAccessRequest(
  _prev: AccessRequestState,
  formData: FormData,
): Promise<AccessRequestState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const athleteName = String(formData.get("athleteName") ?? "").trim();
  const rawYear = String(formData.get("birthYear") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const clubName = String(formData.get("clubName") ?? "").trim();
  const source = String(formData.get("source") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const consent = formData.get("consent") === "1";

  if (!fullName) return { error: "Informe seu nome." };
  if (!consent) return { error: "É necessário aceitar a política de privacidade." };

  const birthYear = rawYear ? Number(rawYear) : null;
  if (
    birthYear !== null &&
    (!Number.isInteger(birthYear) ||
      birthYear < currentSeason() - 20 ||
      birthYear > currentSeason() - 5)
  ) {
    return { error: "Ano de nascimento fora da faixa atendida (6 a 20 anos)." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_access_request", {
    p_full_name: fullName,
    p_phone: phone,
    p_email: email || null,
    p_athlete_name: athleteName || null,
    p_birth_year: birthYear,
    p_city: city || null,
    p_club_name: clubName || null,
    p_source: source || null,
    p_note: note || null,
    p_consent: consent,
  });

  if (error) return { error: `Não foi possível enviar: ${error.message}` };

  const result = (data ?? {}) as { ok?: boolean; error?: string };
  if (!result.ok) {
    return { error: result.error ?? "Não foi possível enviar a solicitação." };
  }

  return { ok: true };
}
