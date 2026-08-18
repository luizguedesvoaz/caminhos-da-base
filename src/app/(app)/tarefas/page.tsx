import { createClient } from "@/lib/supabase/server";
import { getActiveAthlete } from "@/lib/athlete";
import { NewTaskForm } from "@/components/NewTaskForm";
import { TaskItem, type Task } from "@/components/TaskItem";
import { SuggestedTasks } from "@/components/SuggestedTasks";
import { CartelaSemana, type DiaSemana } from "@/components/CartelaSemana";
import { CardProximoJogo } from "@/components/CardProximoJogo";
import { Bloco, Rotulo, TituloBloco, TituloTela } from "@/components/ui";
import {
  friendlyDate,
  toISODate,
  weekDays,
  weekRangeLabel,
  TASK_COINS,
  type TaskCategory,
} from "@/lib/domain/tasks";
import { weeklyStreak, type CompletedTask } from "@/lib/domain/achievements";

export default async function TarefasPage() {
  const { athlete, all } = await getActiveAthlete();
  const supabase = await createClient();

  const hoje = new Date();
  const today = toISODate(hoje);
  const dias = weekDays(hoje);
  const inicioSemana = toISODate(dias[0]);
  const fimSemana = toISODate(dias[6]);

  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 21);

  const historico = new Date();
  historico.setDate(historico.getDate() - 200);

  const [{ data: tasks }, { data: concluidas }, { data: evaluation }] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("id, title, category, due_date, is_done, recurrence")
        .eq("athlete_id", athlete.id)
        .is("deleted_at", null)
        .lte("due_date", toISODate(horizon))
        .order("due_date", { ascending: true })
        .limit(200),
      // Histórico só para a sequência de semanas — não entra em nenhuma lista.
      supabase
        .from("tasks")
        .select("category, completed_at")
        .eq("athlete_id", athlete.id)
        .is("deleted_at", null)
        .eq("is_done", true)
        .gte("completed_at", historico.toISOString())
        .limit(500),
      supabase
        .rpc("current_pyramid_step", { p_athlete_id: athlete.id })
        .single<{ step: number }>(),
    ]);

  const list = (tasks ?? []) as Task[];
  const pending = list.filter((t) => !t.is_done);
  const done = list.filter((t) => t.is_done);

  const overdue = pending.filter((t) => t.due_date && t.due_date < today);
  const upcoming = pending.filter((t) => !t.due_date || t.due_date >= today);

  // ---- A semana: segunda a domingo ----
  const daSemana = list.filter(
    (t) => t.due_date && t.due_date >= inicioSemana && t.due_date <= fimSemana,
  );
  const feitasNaSemana = daSemana.filter((t) => t.is_done);
  const progresso =
    daSemana.length > 0 ? feitasNaSemana.length / daSemana.length : 0;

  /* As moedas da semana são somadas aqui a partir das tarefas concluídas, e não
     lidas do extrato: o extrato é a verdade contábil, mas para desenhar um
     número de resumo ele custaria mais uma consulta. Se divergirem, quem manda
     é o extrato — por isso o número aparece como "moedas na semana", não como
     saldo. */
  const moedasSemana = feitasNaSemana.reduce(
    (soma, t) => soma + TASK_COINS[t.category as TaskCategory],
    0,
  );

  const cartela: { estado: DiaSemana; rotulo: string }[] = dias.map((dia) => {
    const iso = toISODate(dia);
    const doDia = daSemana.filter((t) => t.due_date === iso);
    const rotuloData = dia.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });

    if (doDia.some((t) => t.category === "jogo")) {
      return { estado: "jogo", rotulo: `${rotuloData}: dia de jogo` };
    }
    if (iso === today) return { estado: "hoje", rotulo: `${rotuloData}: hoje` };
    if (iso < today) {
      if (doDia.length === 0) return { estado: "vazio", rotulo: rotuloData };
      return doDia.every((t) => t.is_done)
        ? { estado: "cumprido", rotulo: `${rotuloData}: cumprido` }
        : { estado: "falhou", rotulo: `${rotuloData}: ficou pendente` };
    }
    return { estado: "futuro", rotulo: rotuloData };
  });

  const proximoJogo = upcoming.find(
    (t) => t.category === "jogo" && t.due_date && t.due_date >= today,
  );
  const diasAteJogo = proximoJogo?.due_date
    ? Math.round(
        (new Date(`${proximoJogo.due_date}T12:00:00`).getTime() -
          new Date(`${today}T12:00:00`).getTime()) /
          86_400_000,
      )
    : 0;

  const sequencia = weeklyStreak((concluidas ?? []) as CompletedTask[]);

  // Agrupa por dia — a leitura natural de quem organiza a semana.
  const byDate = new Map<string, Task[]>();
  for (const task of upcoming) {
    if (task.id === proximoJogo?.id) continue; // já aparece no card de ouro
    const key = task.due_date ?? "sem-data";
    byDate.set(key, [...(byDate.get(key) ?? []), task]);
  }

  const recentes = done.slice(-8).reverse();

  return (
    <>
      <header className="flex items-end justify-between gap-4">
        <div>
          <TituloTela>A semana</TituloTela>
          <p className="mt-1.5 text-sm text-tinta-2">
            {weekRangeLabel(dias)}
          </p>
        </div>
        <p className="shrink-0 font-display text-[34px] font-extrabold leading-none tracking-[-.04em] tabular text-acento-texto">
          {feitasNaSemana.length}/{daSemana.length}
        </p>
      </header>

      <Bloco enfase="destaque" className="mt-5">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <Rotulo>Progresso da semana</Rotulo>
          <span className="text-[13px] font-bold tabular text-acento-texto">
            +{moedasSemana} moedas
          </span>
        </div>
        <CartelaSemana dias={cartela} progresso={progresso} />
      </Bloco>

      {list.length === 0 && (
        <div className="mt-5">
          <SuggestedTasks athleteId={athlete.id} step={evaluation?.step ?? 1} />
        </div>
      )}

      {proximoJogo && (
        <CardProximoJogo
          titulo={proximoJogo.title}
          quando={friendlyDate(proximoJogo.due_date!).toLowerCase()}
          faltam={diasAteJogo}
        />
      )}

      {overdue.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-2">
            <span
              aria-hidden
              className="size-3.5 rounded-[4px] border-2 border-alerta bg-alerta-fundo"
            />
            <span className="text-[15px] font-bold text-tinta">
              Ficou pra trás
            </span>
            <span className="text-[15px] font-bold tabular text-alerta">
              {overdue.length}
            </span>
          </h2>
          <ul className="space-y-2.5">
            {overdue.map((task) => (
              <TaskItem key={task.id} task={task} atrasada />
            ))}
          </ul>
        </section>
      )}

      {[...byDate.entries()].map(([date, dayTasks]) => (
        <section key={date} className="mt-6">
          <h2 className="mb-3 text-[15px] font-bold capitalize text-tinta">
            {date === "sem-data" ? "Sem data" : friendlyDate(date)}
          </h2>
          <ul className="space-y-2.5">
            {dayTasks.map((task, i) => (
              <TaskItem
                key={task.id}
                task={task}
                destaque={date === today && i === 0}
              />
            ))}
          </ul>
        </section>
      ))}

      {sequencia > 1 && (
        <Bloco className="mt-6 flex items-center gap-4">
          <p className="font-display text-[44px] font-extrabold leading-none tracking-[-.04em] tabular text-tinta">
            {sequencia}
          </p>
          <div className="min-w-0 flex-1">
            <TituloBloco>semanas seguidas</TituloBloco>
            <p className="mt-1.5 text-[13px] leading-relaxed text-tinta-2">
              Constância é o que a formação cobra — e é o que o clube olha
              quando compara dois atletas do mesmo nível.
            </p>
          </div>
        </Bloco>
      )}

      {recentes.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-[15px] font-bold text-tinta-2">
            Concluídas recentemente
          </h2>
          <ul className="space-y-2.5">
            {recentes.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </ul>
        </section>
      )}

      {list.length > 0 && pending.length === 0 && (
        <p className="mt-6 rounded-[var(--radius-linha)] border-2 border-contorno bg-fundo-2 p-5 text-center text-[14px] text-tinta">
          Tudo em dia por aqui. Bom trabalho.
        </p>
      )}

      <NewTaskForm athleteId={athlete.id} />
    </>
  );
}
