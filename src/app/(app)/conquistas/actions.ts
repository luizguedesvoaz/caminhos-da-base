"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type RedeemResult = {
  ok: boolean;
  error?: string;
  code?: string;
  title?: string;
};

/**
 * Resgate de recompensa.
 *
 * Toda a decisão (saldo, limite mensal, débito) acontece numa função do banco,
 * não aqui. Se a verificação ficasse no app, dois toques rápidos no botão
 * conseguiriam resgatar duas vezes com saldo para uma só.
 */
export async function redeemReward(rewardId: string): Promise<RedeemResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("redeem_reward", {
    p_reward_id: rewardId,
  });

  if (error) return { ok: false, error: `Erro do banco: ${error.message}` };

  revalidatePath("/conquistas");
  return (data ?? { ok: false, error: "Resposta inesperada." }) as RedeemResult;
}

export type ReferralState = { ok?: boolean; error?: string };

/**
 * Solicitação de indicação.
 *
 * A família não gera mais o próprio código: ela envia o contato e o consultor
 * decide. Isso preserva o controle de quem entra no app — necessário se o
 * produto passar a ser pago — e evita que convites circulem sem rastro.
 *
 * O telefone é dado pessoal de terceiro, então a confirmação de autorização é
 * obrigatória e fica registrada com data.
 */
export async function submitReferralRequest(
  _prev: ReferralState,
  formData: FormData,
): Promise<ReferralState> {
  const familyName = String(formData.get("familyName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const athleteName = String(formData.get("athleteName") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const consent = formData.get("consent") === "1";

  if (!familyName) return { error: "Informe o nome da família." };
  if (!consent) {
    return {
      error: "Confirme que a família autorizou o contato antes de enviar.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_referral_request", {
    p_family_name: familyName,
    p_phone: phone,
    p_athlete_name: athleteName || null,
    p_note: note || null,
    p_consent: consent,
  });

  if (error) return { error: `Erro do banco: ${error.message}` };

  const result = (data ?? {}) as { ok?: boolean; error?: string };
  if (!result.ok) {
    return { error: result.error ?? "Não foi possível enviar a indicação." };
  }

  revalidatePath("/conquistas");
  return { ok: true };
}

export async function claimMonthlyBonus(): Promise<{ awarded: number }> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("claim_monthly_bonus");
  revalidatePath("/conquistas");
  return { awarded: Number(data ?? 0) };
}
