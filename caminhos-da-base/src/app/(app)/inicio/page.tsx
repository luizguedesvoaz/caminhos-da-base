import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getActiveAthlete } from "@/lib/athlete";
import { AthleteHeader } from "@/components/AthleteHeader";
import { Pyramid } from "@/components/Pyramid";
import { Card } from "@/components/ui";
import { STEPS, NEXT_STEP_CHECKLIST, type Step } from "@/lib/domain/pyramid";
import {
  categoryFor,
  categoryLabel,
  categoryYear,
  currentSeason,
} from "@/lib/domain/category";
import { formatCents } from "@/lib/domain/expenses";
import { TASK_CATEGORIES, toISODate, type TaskCategory } from "@/lib/domain/tasks";

export default async function InicioPage() {
  const { athlete, all } = await getActiveAthlete();
  const supabase = await createClient();
  const season = currentSeason();

  const today = new Date();
  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [{ data: evaluation }, { data: invested }, { data: weekTasks }] =
    await Promise.all([
      supabase
        .rpc("current_pyramid_step", { p_athlete_id: athlete.id })
        .single<{ step: number; reason: string }>(),
      supabase.rpc("total_invested_cents", { p_athlete_id: athlete.id }),
      supabase
        .from("tasks")
        .select("id, title, category, due_date, is_done")
        .eq("athlete_id", athlete.id)
        .is("deleted_at", null)
        .eq("is_done", false)
        .lte("due_date", toISODate(weekEnd))
        .order("due_date")
        .limit(50),
    ]);

  const step = (evaluation?.step ?? 1) as Step;
  const category = categoryFor(athlete.birth_year, season);
  const yearInCategory = categoryYear(athlete.birth_year, season);

  const tasks = weekTasks ?? [];
  const todayIso = toISODate(today);
  const overdue = tasks.filter((t) => t.due_date && t.due_date < todayIso);
  const thisWeek = tasks.filter((t) => !t.due_date || t.due_date >= todayIso);

  // Contagem por categoria — a "visão semanal por categoria" do briefing.
  const perCategory = new Map<TaskCategory, number>();
  for (const t of thisWeek) {
    const key = t.category as TaskCategory;
    perCategory.set(key, (perCategory.get(key) ?? 0) + 1);
  }

  const subtitle = [
    categoryLabel(category),
    yearInCategory && `${yearInCategory === "primeiro" ? "1º" : "2º"} ano`,
    athlete.current_club_name,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <AthleteHeader athlete={athlete} all={all} subtitle={subtitle} />

      {overdue.length > 0 && (
        <Link href="/tarefas" className="mb-4 block">
          <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4">
            <AlertTriangle size={20} className="shrink-0 text-red-700" aria-hidden />
            <p className="flex-1 text-sm text-red-800">
              {overdue.length === 1
                ? "1 tarefa atrasada"
                : `${overdue.length} tarefas atrasadas`}
            </p>
            <ChevronRight size={18} className="text-red-700" aria-hidden />
          </div>
        </Link>
      )}

      <Card className="bg-navy-900 text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-gold-400">
          Degrau {step} de 3
        </p>
        <h2 className="mt-1 text-xl font-bold">{STEPS[step].name}</h2>
        <div className="mx-auto my-6 w-44">
          <Pyramid step={step} />
        </div>
        {evaluation?.reason && (
          <p className="text-sm leading-relaxed text-white/70">
            {evaluation.reason}
          </p>
        )}
      </Card>

      {step < 3 && (
        <Card className="mt-4">
          <h2 className="font-semibold text-navy-900">
            O que falta para o próximo degrau
          </h2>
          <ul className="mt-3 space-y-2.5">
            {NEXT_STEP_CHECKLIST[step].slice(0, 3).map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed">
                <span
                  aria-hidden
                  className="mt-1.5 size-2 shrink-0 rounded-full bg-gold-500"
                />
                <span className="text-ink">{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Link href="/tarefas" className="mt-4 block">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-navy-900">Sua semana</h2>
            <ChevronRight size={18} className="text-muted" aria-hidden />
          </div>

          {thisWeek.length === 0 ? (
            <p className="mt-2 text-sm text-muted">
              Nenhuma tarefa para os próximos 7 dias.
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted">
                {thisWeek.length}{" "}
                {thisWeek.length === 1 ? "tarefa aberta" : "tarefas abertas"}
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {[...perCategory.entries()].map(([cat, count]) => (
                  <li
                    key={cat}
                    className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-ink"
                  >
                    <span
                      aria-hidden
                      className="size-2 rounded-full"
                      style={{ backgroundColor: TASK_CATEGORIES[cat].color }}
                    />
                    {TASK_CATEGORIES[cat].label}
                    <span className="font-semibold tabular-nums">{count}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </Link>

      <Link href="/financeiro" className="mt-4 block">
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">Total investido</p>
            <ChevronRight size={18} className="text-muted" aria-hidden />
          </div>
          <p className="mt-1 text-3xl font-bold tabular-nums text-navy-900">
            {formatCents(Number(invested ?? 0))}
          </p>
        </Card>
      </Link>
    </>
  );
}
