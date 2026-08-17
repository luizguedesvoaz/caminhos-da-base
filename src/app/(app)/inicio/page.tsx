import Link from "next/link";
import { ChevronRight, UserCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getActiveAthlete } from "@/lib/athlete";
import { AthleteHeader } from "@/components/AthleteHeader";
import { Pyramid } from "@/components/Pyramid";
import { AlertsCard, type Alert } from "@/components/AlertsCard";
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
import { documentStatus } from "@/lib/domain/documents";
import { summarize, formatMinutes, type Match } from "@/lib/domain/season";

export default async function InicioPage() {
  const { athlete, all } = await getActiveAthlete();
  const supabase = await createClient();
  const season = currentSeason();

  const today = new Date();
  const todayIso = toISODate(today);
  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [
    { data: evaluation },
    { data: invested },
    { data: weekTasks },
    { data: documents },
    { data: registration },
    { data: matches },
  ] = await Promise.all([
    supabase
      .rpc("current_pyramid_step", { p_athlete_id: athlete.id })
      .single<{ step: number; reason: string }>(),
    supabase.rpc("total_invested_cents", { p_athlete_id: athlete.id }),
    supabase
      .from("tasks")
      .select("id, category, due_date")
      .eq("athlete_id", athlete.id)
      .is("deleted_at", null)
      .eq("is_done", false)
      .lte("due_date", toISODate(weekEnd))
      .order("due_date")
      .limit(50),
    supabase
      .from("documents")
      .select("id, title, expires_on")
      .eq("athlete_id", athlete.id)
      .is("deleted_at", null)
      .not("expires_on", "is", null),
    supabase
      .from("federation_registrations")
      .select("transfer_window_ends_on")
      .eq("athlete_id", athlete.id)
      .eq("season_year", season)
      .maybeSingle(),
    supabase
      .from("matches")
      .select(
        "id, played_on, opponent, competition_name, minutes_played, goals, assists, video_url, notes",
      )
      .eq("athlete_id", athlete.id)
      .eq("season_year", season)
      .is("deleted_at", null),
  ]);

  const step = (evaluation?.step ?? 1) as Step;
  const category = categoryFor(athlete.birth_year, season);
  const yearInCategory = categoryYear(athlete.birth_year, season);

  const tasks = weekTasks ?? [];
  const overdue = tasks.filter((t) => t.due_date && t.due_date < todayIso);
  const thisWeek = tasks.filter((t) => !t.due_date || t.due_date >= todayIso);

  const perCategory = new Map<TaskCategory, number>();
  for (const t of thisWeek) {
    const key = t.category as TaskCategory;
    perCategory.set(key, (perCategory.get(key) ?? 0) + 1);
  }

  // ---- Alertas, em ordem de urgência ----
  const alerts: Alert[] = [];

  if (overdue.length > 0) {
    alerts.push({
      key: "tarefas",
      href: "/tarefas",
      tone: "urgent",
      icon: "task",
      text:
        overdue.length === 1
          ? "1 tarefa atrasada"
          : `${overdue.length} tarefas atrasadas`,
    });
  }

  for (const doc of documents ?? []) {
    const { status, days } = documentStatus(doc.expires_on);
    if (status === "vencido") {
      alerts.push({
        key: `doc-${doc.id}`,
        href: "/documentos",
        tone: "urgent",
        icon: "document",
        text: `${doc.title} está vencido`,
      });
    } else if (status === "vencendo") {
      alerts.push({
        key: `doc-${doc.id}`,
        href: "/documentos",
        tone: "warning",
        icon: "document",
        text:
          days === 0
            ? `${doc.title} vence hoje`
            : `${doc.title} vence em ${days} ${days === 1 ? "dia" : "dias"}`,
      });
    }
  }

  if (registration?.transfer_window_ends_on) {
    const { status, days } = documentStatus(registration.transfer_window_ends_on);
    if (status === "vencendo") {
      alerts.push({
        key: "janela",
        href: "/documentos",
        tone: "warning",
        icon: "federation",
        text: `Janela de transferência fecha em ${days} ${days === 1 ? "dia" : "dias"}`,
      });
    }
  }

  const stats = summarize((matches ?? []) as Match[]);

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

      <AlertsCard alerts={alerts.slice(0, 4)} />

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

      <Link href="/tarefas" prefetch={false} className="mt-4 block">
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

      {stats.matches > 0 && (
        <Link href="/temporada" prefetch={false} className="mt-4 block">
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">Minutos em campo em {season}</p>
              <ChevronRight size={18} className="text-muted" aria-hidden />
            </div>
            <p className="mt-1 text-3xl font-bold tabular-nums text-navy-900">
              {formatMinutes(stats.minutes)}
            </p>
            <p className="mt-1 text-sm text-muted">
              {stats.matches} {stats.matches === 1 ? "jogo" : "jogos"} · média de{" "}
              {stats.averageMinutes} min
            </p>
          </Card>
        </Link>
      )}

      <Link href="/financeiro" prefetch={false} className="mt-4 block">
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

      {/* Perfil saiu da barra inferior para dar lugar a Conquistas; o acesso
          passa a ser por aqui, onde documentos e vínculo também são alcançados. */}
      <Link
        href="/perfil"
        prefetch={false}
        className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3.5 text-sm font-semibold text-ink"
      >
        <UserCircle size={18} aria-hidden />
        Perfil, documentos e vínculo
        <ChevronRight size={18} className="ml-auto text-muted" aria-hidden />
      </Link>
    </>
  );
}
