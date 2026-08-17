"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ApproveResult = {
  ok: boolean;
  error?: string;
  code?: string;
  phone?: string;
  name?: string;
};

/**
 * Aprova uma entrada e devolve o código pronto para envio.
 *
 * Existem duas filas com origens diferentes — indicação de uma família e
 * solicitação pública da página inicial — e cada uma tem sua função no banco.
 * O painel trata as duas na mesma tela, então o tipo vem junto do pedido.
 */
export async function approveEntry(
  kind: "publica" | "indicacao",
  id: string,
): Promise<ApproveResult> {
  const supabase = await createClient();
  const fn =
    kind === "publica" ? "approve_access_request" : "approve_referral_request";

  const { data, error } = await supabase.rpc(fn, { p_request_id: id });
  if (error) return { ok: false, error: `Erro do banco: ${error.message}` };

  revalidatePath("/painel/entradas");
  revalidatePath("/painel");
  return (data ?? { ok: false, error: "Resposta inesperada." }) as ApproveResult;
}

export async function rejectEntry(
  kind: "publica" | "indicacao",
  id: string,
  reason: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const fn =
    kind === "publica" ? "reject_access_request" : "reject_referral_request";

  const { error } = await supabase.rpc(fn, {
    p_request_id: id,
    p_reason: reason || "sem motivo informado",
  });
  if (error) return { ok: false, error: `Erro do banco: ${error.message}` };

  revalidatePath("/painel/entradas");
  revalidatePath("/painel");
  return { ok: true };
}

/** Pausa ou reativa o acesso de uma família. Não apaga nada. */
export async function toggleAccountBlock(
  userId: string,
  blocked: boolean,
  reason: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_account_blocked", {
    p_user_id: userId,
    p_blocked: blocked,
    p_reason: reason || null,
  });

  if (error) return { ok: false, error: `Erro do banco: ${error.message}` };
  if (data !== true) {
    return {
      ok: false,
      error: "Não foi possível alterar. Conta de consultor não pode ser pausada.",
    };
  }

  revalidatePath("/painel");
  return { ok: true };
}

export async function setAthleteStep(
  athleteId: string,
  step: number,
  note: string,
): Promise<{ ok: boolean; error?: string }> {
  if (![1, 2, 3].includes(step)) return { ok: false, error: "Degrau inválido." };
  if (!note.trim()) {
    return {
      ok: false,
      error: "Escreva o motivo do ajuste — ele fica no histórico do atleta.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("consultant_set_step", {
    p_athlete_id: athleteId,
    p_step: step,
    p_note: note.trim(),
  });

  if (error) return { ok: false, error: `Erro do banco: ${error.message}` };
  if (data !== true) return { ok: false, error: "Não foi possível ajustar." };

  revalidatePath(`/painel/atleta/${athleteId}`);
  revalidatePath("/painel");
  return { ok: true };
}

/** Recalcula o degrau de todos. Necessário depois de mexer nas regras. */
export async function recalculateAll(): Promise<{ count: number; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("consultant_recalculate_all");

  if (error) return { count: 0, error: `Erro do banco: ${error.message}` };

  revalidatePath("/painel");
  revalidatePath("/painel/regras");
  return { count: Number(data ?? 0) };
}

export async function upsertCompetition(
  id: string | null,
  name: string,
  state: string,
  stepLevel: number,
): Promise<{ ok: boolean; error?: string }> {
  if (!name.trim()) return { ok: false, error: "Informe o nome da competição." };
  if (![1, 2, 3].includes(stepLevel)) {
    return { ok: false, error: "Degrau precisa ser 1, 2 ou 3." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("consultant_upsert_competition", {
    p_id: id,
    p_name: name.trim(),
    p_state: state.trim() || null,
    p_step_level: stepLevel,
  });

  if (error) return { ok: false, error: `Erro do banco: ${error.message}` };
  if (!data) return { ok: false, error: "Não foi possível salvar." };

  revalidatePath("/painel/regras");
  return { ok: true };
}

export async function deleteCompetition(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("consultant_delete_competition", {
    p_id: id,
  });

  if (error) return { ok: false, error: `Erro do banco: ${error.message}` };

  revalidatePath("/painel/regras");
  return { ok: true };
}
