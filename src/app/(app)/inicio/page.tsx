import Link from "next/link";
import { ChevronRight, FileText, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getActiveAthlete } from "@/lib/athlete";
import { CartazAtleta } from "@/components/CartazAtleta";
import { CardProximoJogo } from "@/components/CardProximoJogo";
import { BarrasJogos } from "@/components/BarrasJogos";
import { Pyramid } from "@/components/Pyramid";
import { AlertsCard, type Alert } from "@/components/AlertsCard";
import { TaskItem, type Task } from "@/components/TaskItem";
import { NewMatchForm } from "@/components/NewMatchForm";
import { Bloco, Rotulo, Placar, TituloBloco } from "@/components/ui";
import { STEPS, type Step } from "@/lib/domain/pyramid";
import {
  categoryFor,
  categoryLabel,
  categoryYear,
  currentSeason,
} from "@/lib/domain/category";
import { friendlyDate, toISODate } from "@/lib/domain/tasks";
import { documentStatus } from "@/lib/domain/documents";
import { summarize, formatMinutes, type Match } from "@/lib/domain/season";

export default async function InicioPage() {
  const { athlete, all } = await getActiveAthlete();
  const supabase = await createClient();
  const season = currentSeason();

  const today = new Date();
  const todayIso = toISODate(today);
  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + 14);

  const [
    { data: evaluation },
    { data: coins },
    { data: weekTasks },
    { data: documents },
    { data: registration },
    { data: matches },
  ] = await Promise.all([
    supabase
      .rpc("current_pyramid_step", { p_athlete_id: athlete.id })
      .single<{ step: number; reason: string }>(),
    supabase.rpc("coin_balance"),
    supabase
      .from("tasks")
      .select("id, title, category, due_date, is_done, recurrence")
      .eq("athlete_id", athlete.id)
      .is("deleted_at", null)
      .eq("is_done", false)
      .lte("due_date", toISODate(weekEnd))
      .order("due_date")
      .limit(60),
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
      .is("deleted_at", null)
      .order("played_on", { ascending: true }),
  ]);

  const step = (evaluation?.step ?? 1) as Step;
  const category = categoryFor(athlete.birth_year, season);
  const yearInCategory = categoryYear(athlete.birth_year, season);

  const tasks = (weekTasks ?? []) as Task[];
  const overdue = tasks.filter((t) => t.due_date && t.due_date < todayIso);
  const hoje = tasks.filter((t) => t.due_date === todayIso);
  const semData = tasks.filter((t) => !t.due_date);

  /* O "próximo jogo" sai da agenda de tarefas: não existe tabela de partidas
     futuras, e criar uma só para isto seria pedir à família que cadastre a
     mesma coisa duas vezes. Uma tarefa de categoria "jogo" com data à frente
     é exatamente o dado que já temos. */
  const proximoJogo = tasks.find(
    (t) => t.category === "jogo" && t.due_date && t.due_date >= todayIso,
  );
  const diasAteJogo = proximoJogo?.due_date
    ? Math.round(
        (new Date(`${proximoJogo.due_date}T12:00:00`).getTime() -
          new Date(`${todayIso}T12:00:00`).getTime()) /
          86_400_000,
      )
    : 0;

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

  const lista = (matches ?? []) as Match[];
  const stats = summarize(lista);
  const ultimos8 = lista.slice(-8).map((m) => ({
    minutos: m.minutes_played ?? 0,
    rotulo: `${m.opponent ?? "Jogo"} — ${m.minutes_played ?? 0} min`,
  }));

  const chip = [
    categoryLabel(category),
    yearInCategory && `${yearInCategory === "primeiro" ? "1º" : "2º"} ano`,
  ]
    .filter(Boolean)
    .join(" · ");

  const doDia = [...hoje, ...semData].slice(0, 3);

  return (
    <>
      <CartazAtleta
        athlete={athlete}
        all={all}
        chip={chip}
        clube={athlete.current_club_name}
        moedas={Number(coins ?? 0)}
        degrau={step}
      />

      {proximoJogo && (
        <CardProximoJogo
          titulo={proximoJogo.title}
          quando={friendlyDate(proximoJogo.due_date!).toLowerCase()}
          faltam={diasAteJogo}
        />
      )}

      {/* Minutagem é o número-herói: é o que olheiro de base olha primeiro. */}
      <Bloco enfase="destaque" className="mt-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <Rotulo>Minutos em campo · {season}</Rotulo>
            <Placar tamanho={72} className="mt-2">
              {stats.matches > 0 ? formatMinutes(stats.minutes) : "—"}
            </Placar>
          </div>
          {stats.matches > 0 && (
            <div className="pb-1 text-right">
              <p className="font-display text-[26px] font-extrabold leading-none tracking-[-.03em] tabular text-tinta">
                {stats.averageMinutes}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-[.14em] text-tinta-2">
                min/jogo
              </p>
            </div>
          )}
        </div>

        {ultimos8.length > 0 && (
          <div className="mt-4">
            <BarrasJogos jogos={ultimos8} />
            <p className="mt-2 text-[13px] text-tinta-2">
              Últimos {ultimos8.length}{" "}
              {ultimos8.length === 1 ? "jogo" : "jogos"} · {stats.matches} na
              temporada
            </p>
          </div>
        )}

        {stats.matches === 0 && (
          <p className="mt-2 text-[13px] leading-relaxed text-tinta-2">
            Nenhum jogo registrado ainda. Registre o primeiro e a temporada
            começa a virar história.
          </p>
        )}
      </Bloco>

      {/* O degrau vem comprimido aqui: no Início ele é lembrete, não revelação. */}
      <Link href="/perfil" prefetch={false} className="mt-5 block">
        <Bloco className="overflow-hidden p-0">
          <div className="flex items-center justify-between bg-marinho-fundo px-4 py-2.5">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-jogo">
              Degrau {step} de 3
            </p>
            <ChevronRight size={16} className="text-marinho-tinta" aria-hidden />
          </div>
          <div className="p-4">
            <TituloBloco>{STEPS[step].name}</TituloBloco>
            <div className="mt-3">
              <Pyramid step={step} />
            </div>
            {evaluation?.reason && (
              <p className="mt-3 text-[13px] leading-relaxed text-tinta-2">
                {evaluation.reason}
              </p>
            )}
          </div>
        </Bloco>
      </Link>

      <section className="mt-6">
        <div className="mb-3 flex items-baseline justify-between">
          <TituloBloco>Hoje</TituloBloco>
          <Link
            href="/tarefas"
            prefetch={false}
            className="text-[13px] font-bold text-tinta-2 underline"
          >
            ver a semana
          </Link>
        </div>

        {doDia.length === 0 ? (
          <p className="rounded-[var(--radius-linha)] border-2 border-contorno bg-fundo-2 p-4 text-[14px] text-tinta-2">
            Nada marcado para hoje.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {doDia.map((task, i) => (
              <TaskItem key={task.id} task={task} destaque={i === 0} />
            ))}
          </ul>
        )}
      </section>

      <AlertsCard alerts={alerts.slice(0, 4)} />

      {/* Modo responsável: dinheiro e papelada ficam atrás de uma faixa própria,
          porque o adolescente também abre este app e essa parte não é dele. */}
      <div className="mt-6 rounded-[var(--radius-bloco)] border-2 border-dashed border-contorno p-4">
        <Rotulo>Modo responsável</Rotulo>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <Link
            href="/financeiro"
            prefetch={false}
            className="flex min-h-11 items-center gap-2 rounded-[var(--radius-linha)] border-2 border-contorno px-3 py-2.5 text-[14px] font-bold text-tinta"
          >
            <Wallet size={16} strokeWidth={2.2} aria-hidden />
            Custo
          </Link>
          <Link
            href="/documentos"
            prefetch={false}
            className="flex min-h-11 items-center gap-2 rounded-[var(--radius-linha)] border-2 border-contorno px-3 py-2.5 text-[14px] font-bold text-tinta"
          >
            <FileText size={16} strokeWidth={2.2} aria-hidden />
            Documentos
          </Link>
        </div>
        <Link
          href="/perfil"
          prefetch={false}
          className="mt-2.5 flex min-h-11 items-center gap-2 rounded-[var(--radius-linha)] border-2 border-contorno px-3 py-2.5 text-[14px] font-bold text-tinta"
        >
          Perfil, vínculo e aparência
          <ChevronRight size={16} className="ml-auto text-tinta-2" aria-hidden />
        </Link>
      </div>

      <NewMatchForm athleteId={athlete.id} />
    </>
  );
}
