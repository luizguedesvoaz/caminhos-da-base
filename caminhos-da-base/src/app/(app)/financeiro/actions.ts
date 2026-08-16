"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  EXPENSE_CATEGORY_KEYS,
  parseAmountToCents,
  type ExpenseCategory,
} from "@/lib/domain/expenses";
import { toISODate } from "@/lib/domain/tasks";

export type ExpenseState = { error?: string; ok?: boolean };

export async function createExpense(
  _prev: ExpenseState,
  formData: FormData,
): Promise<ExpenseState> {
  const athleteId = String(formData.get("athleteId") ?? "");
  const rawAmount = String(formData.get("amount") ?? "");
  const category = String(formData.get("category") ?? "") as ExpenseCategory;
  const spentOn = String(formData.get("spentOn") ?? "") || toISODate(new Date());
  const note = String(formData.get("note") ?? "").trim();

  // Converte para centavos inteiros. Recusa em vez de adivinhar — um valor
  // errado aqui contamina o total investido, o número mais sensível do app.
  const amountCents = parseAmountToCents(rawAmount);
  if (amountCents === null)
    return { error: "Valor inválido. Use algo como 150 ou 150,50." };
  if (amountCents === 0) return { error: "O valor precisa ser maior que zero." };

  if (!EXPENSE_CATEGORY_KEYS.includes(category))
    return { error: "Escolha uma categoria." };
  if (!athleteId) return { error: "Nenhum atleta selecionado." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const { error } = await supabase.from("expenses").insert({
    athlete_id: athleteId,
    amount_cents: amountCents,
    category,
    spent_on: spentOn,
    season_year: Number(spentOn.slice(0, 4)),
    note: note || null,
    created_by: user.id,
  });

  if (error) {
    if (/row-level security/i.test(error.message)) {
      return {
        error:
          "Sem permissão para lançar gastos deste atleta. O módulo financeiro é dos responsáveis.",
      };
    }
    return { error: `Erro do banco: ${error.message}` };
  }

  revalidatePath("/financeiro");
  revalidatePath("/inicio");
  return { ok: true };
}

export async function deleteExpense(expenseId: string) {
  const supabase = await createClient();
  await supabase
    .from("expenses")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", expenseId);

  revalidatePath("/financeiro");
  revalidatePath("/inicio");
}
