"use client";

import { useTransition } from "react";
import { Check, Trash2, Repeat } from "lucide-react";
import { toggleTask, deleteTask } from "@/app/(app)/tarefas/actions";
import { TASK_CATEGORIES, TASK_COINS, type TaskCategory } from "@/lib/domain/tasks";

export type Task = {
  id: string;
  title: string;
  category: TaskCategory;
  due_date: string | null;
  is_done: boolean;
  recurrence: string | null;
};

/**
 * A linha de tarefa — o elemento mais tocado do app.
 *
 * A área clicável é a linha inteira (caixa + nome), não só o quadradinho de
 * 24px: quem usa isto está de pé no vestiário ou dirigindo para o treino.
 * A moeda fica à direita porque é a recompensa, e recompensa se lê depois
 * do que foi feito.
 */
export function TaskItem({
  task,
  atrasada = false,
  destaque = false,
}: {
  task: Task;
  atrasada?: boolean;
  /** Primeiro pendente de hoje: ganha a sombra sólida, é o que tocar agora. */
  destaque?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const meta = TASK_CATEGORIES[task.category];
  const moedas = TASK_COINS[task.category];
  const feita = task.is_done;

  const moldura = feita
    ? "border-contorno bg-fundo-2"
    : atrasada
      ? "border-alerta bg-alerta-fundo"
      : "border-contorno bg-fundo";

  return (
    <li
      className={`flex items-center gap-3 rounded-[var(--radius-linha)] border-2 p-3.5 transition-[background-color,opacity] duration-[180ms] ${moldura} ${
        destaque && !feita ? "shadow-[var(--sombra-bloco)]" : ""
      } ${pending ? "opacity-50" : ""}`}
    >
      <button
        onClick={() => startTransition(() => toggleTask(task.id, !feita))}
        aria-pressed={feita}
        aria-label={feita ? `Reabrir ${task.title}` : `Concluir ${task.title}`}
        className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span
          aria-hidden
          className={`flex size-6 shrink-0 items-center justify-center rounded-[var(--radius-selecao)] border-2 transition-colors duration-[180ms] ${
            feita
              ? "border-acento bg-acento text-acento-tinta"
              : atrasada
                ? "border-alerta"
                : "border-acento"
          }`}
        >
          {feita && <Check size={15} strokeWidth={3} />}
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={`block text-[15px] font-medium leading-snug ${
              feita ? "text-tinta-3 line-through" : "text-tinta"
            }`}
          >
            {task.title}
          </span>
          {/* A cor nunca identifica sozinha: o ponto sempre vem com o rótulo. */}
          <span
            className={`mt-1 flex items-center gap-1.5 text-[13px] ${
              atrasada && !feita ? "text-alerta" : "text-tinta-2"
            }`}
          >
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: meta.color }}
            />
            {meta.label}
            {atrasada && !feita && <span>· atrasada</span>}
            {task.recurrence && (
              <>
                <Repeat size={12} aria-hidden />
                <span>toda semana</span>
              </>
            )}
          </span>
        </span>

        <span
          className={`shrink-0 text-[13px] font-bold tabular transition-[transform,opacity] duration-[240ms] ${
            feita ? "-translate-y-1 text-ok opacity-70" : "text-acento-texto"
          }`}
        >
          +{moedas}
        </span>
      </button>

      <button
        onClick={() => startTransition(() => deleteTask(task.id))}
        aria-label={`Excluir ${task.title}`}
        className="shrink-0 p-1 text-tinta-3 transition-colors hover:text-alerta"
      >
        <Trash2 size={16} aria-hidden />
      </button>
    </li>
  );
}
