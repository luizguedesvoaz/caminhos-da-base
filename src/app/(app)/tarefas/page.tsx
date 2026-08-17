import { createClient } from "@/lib/supabase/server";
import { getActiveAthlete } from "@/lib/athlete";
import { AthleteHeader } from "@/components/AthleteHeader";
import { NewTaskForm } from "@/components/NewTaskForm";
import { TaskItem, type Task } from "@/components/TaskItem";
import { SuggestedTasks } from "@/components/SuggestedTasks";
import { friendlyDate, toISODate } from "@/lib/domain/tasks";
import { categoryLabel, categoryFor, currentSeason } from "@/lib/domain/category";

export default async function TarefasPage() {
  const { athlete, all } = await getActiveAthlete();
  const supabase = await createClient();

  const today = toISODate(new Date());
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 21);

  // Pendentes atrasadas + próximas 3 semanas, e concluídas recentes.
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, category, due_date, is_done, recurrence")
    .eq("athlete_id", athlete.id)
    .is("deleted_at", null)
    .lte("due_date", toISODate(horizon))
    .order("due_date", { ascending: true })
    .limit(200);

  const list = (tasks ?? []) as Task[];
  const pending = list.filter((t) => !t.is_done);
  const done = list.filter((t) => t.is_done).slice(-15).reverse();

  const overdue = pending.filter((t) => t.due_date && t.due_date < today);
  const upcoming = pending.filter((t) => !t.due_date || t.due_date >= today);

  // Agrupa por dia — a leitura natural de quem organiza a semana.
  const byDate = new Map<string, Task[]>();
  for (const task of upcoming) {
    const key = task.due_date ?? "sem-data";
    byDate.set(key, [...(byDate.get(key) ?? []), task]);
  }

  const { data: evaluation } = await supabase
    .rpc("current_pyramid_step", { p_athlete_id: athlete.id })
    .single<{ step: number }>();

  const season = currentSeason();
  const subtitle = `${categoryLabel(categoryFor(athlete.birth_year, season))} · ${pending.length} ${
    pending.length === 1 ? "tarefa aberta" : "tarefas abertas"
  }`;

  return (
    <>
      <AthleteHeader athlete={athlete} all={all} subtitle={subtitle} />

      {list.length === 0 && (
        <SuggestedTasks athleteId={athlete.id} step={evaluation?.step ?? 1} />
      )}

      {overdue.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-red-700">
            Atrasadas ({overdue.length})
          </h2>
          <ul className="space-y-2">
            {overdue.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </ul>
        </section>
      )}

      {[...byDate.entries()].map(([date, dayTasks]) => (
        <section key={date} className="mb-6">
          <h2 className="mb-2 text-sm font-semibold capitalize text-navy-900">
            {date === "sem-data" ? "Sem data" : friendlyDate(date)}
          </h2>
          <ul className="space-y-2">
            {dayTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </ul>
        </section>
      ))}

      {done.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-muted">
            Concluídas recentemente
          </h2>
          <ul className="space-y-2">
            {done.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </ul>
        </section>
      )}

      {list.length > 0 && pending.length === 0 && (
        <p className="rounded-xl bg-navy-50 p-5 text-center text-sm text-ink">
          Tudo em dia por aqui. Bom trabalho.
        </p>
      )}

      <NewTaskForm athleteId={athlete.id} />
    </>
  );
}
