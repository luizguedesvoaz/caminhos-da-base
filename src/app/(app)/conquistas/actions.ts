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

export async function createReferralCode(): Promise<{
  code?: string;
  error?: string;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_referral_code");

  if (error) return { error: `Erro do banco: ${error.message}` };
  if (!data) {
    return {
      error:
        "Você já tem 5 códigos aguardando uso. Espere alguém usar antes de gerar outro.",
    };
  }

  revalidatePath("/conquistas");
  return { code: data as string };
}

export async function claimMonthlyBonus(): Promise<{ awarded: number }> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("claim_monthly_bonus");
  revalidatePath("/conquistas");
  return { awarded: Number(data ?? 0) };
}
