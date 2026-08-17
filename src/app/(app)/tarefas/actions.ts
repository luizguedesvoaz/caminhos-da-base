"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  TASK_CATEGORY_KEYS,
  weeklyOccurrences,
  toISODate,
  type TaskCategory,
} from "@/lib/domain/tasks";

export type TaskState = { error?: string; ok?: boolean };

/**
 * Mensagem de erro útil.
 *
 * Na onda 1, um bug de RLS apareceu como "Não foi possível salvar" e custou
 * uma investigação inteira para localizar. Agora o motivo real do banco chega
 * até a tela — traduzido quando dá, cru quando não dá. Diagnóstico ruim é
 * mais caro que uma mensagem feia.
 */
function describe(error: { message?: string; code?: string } | null): string {
  if (!error) return "Erro desconhecido.";
  const message = error.message ?? "";

  if (/row-level security|violates row-level/i.test(message)) {
    return "Sem permissão para alterar este atleta. Saia e entre novamente.";
  }
  if (/duplicate key/i.test(message)) {
    return "Esse registro já existe.";
  }
  if (/violates check constraint/i.test(message)) {
    return "Algum valor está fora do permitido. Revise os campos.";
  }
  if (/network|fetch failed/i.test(message)) {
    return "Sem conexão com o servidor. Verifique sua internet.";
  }
  return `Erro do banco: ${message}${error.code ? ` (${error.code})` : ""}`;
}

export async function createTask(
  _prev: TaskState,
  formData: FormData,
): Promise<TaskState> {
  const athleteId = String(formData.get("athleteId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "") as TaskCategory;
  const dueDate = String(formData.get("dueDate") ?? "");
  const weekdays = formData
    .getAll("weekdays")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);

  if (!title) return { error: "Escreva o que precisa ser feito." };
  if (!TASK_CATEGORY_KEYS.includes(category))
    return { error: "Escolha uma categoria." };
  if (!athleteId) return { error: "Nenhum atleta selecionado." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const start = dueDate ? new Date(`${dueDate}T12:00:00`) : new Date();

  // Recorrência semanal vira linhas reais, uma por dia — assim cada ocorrência
  // pode ser concluída ou ajustada isoladamente, sem lógica de série.
  const dates =
    weekdays.length > 0 ? weeklyOccurrences(start, weekdays) : [toISODate(start)];

  const recurrence =
    weekdays.length > 0 ? `weekly:${[...weekdays].sort().join(",")}` : null;

  const { error } = await supabase.from("tasks").insert(
    dates.map((due_date) => ({
      athlete_id: athleteId,
      title,
      category,
      due_date,
      recurrence,
      created_by: user.id,
    })),
  );

  if (error) return { error: describe(error) };

  revalidatePath("/tarefas");
  revalidatePath("/inicio");
  return { ok: true };
}

export async function toggleTask(taskId: string, done: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase
    .from("tasks")
    .update({
      is_done: done,
      completed_at: done ? new Date().toISOString() : null,
      completed_by: done ? (user?.id ?? null) : null,
    })
    .eq("id", taskId);

  revalidatePath("/tarefas");
  revalidatePath("/inicio");
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient();
  await supabase
    .from("tasks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", taskId);

  revalidatePath("/tarefas");
  revalidatePath("/inicio");
}

/** Cria de uma vez a checklist sugerida para o degrau atual. */
export async function addSuggestedTasks(
  athleteId: string,
  items: { title: string; category: TaskCategory }[],
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const today = toISODate(new Date());
  await supabase.from("tasks").insert(
    items.map((item) => ({
      athlete_id: athleteId,
      title: item.title,
      category: item.category,
      due_date: today,
      created_by: user.id,
    })),
  );

  revalidatePath("/tarefas");
  revalidatePath("/inicio");
}
