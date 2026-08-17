"use client";

import { useTransition } from "react";
import { Trash2, Repeat } from "lucide-react";
import { toggleTask, deleteTask } from "@/app/(app)/tarefas/actions";
import { TASK_CATEGORIES, type TaskCategory } from "@/lib/domain/tasks";

export type Task = {
  id: string;
  title: string;
  category: TaskCategory;
  due_date: string | null;
  is_done: boolean;
  recurrence: string | null;
};

export function TaskItem({ task }: { task: Task }) {
  const [pending, startTransition] = useTransition();
  const meta = TASK_CATEGORIES[task.category];

  return (
    <li
      className={`flex items-start gap-3 rounded-xl border border-line bg-white p-3.5 transition-opacity ${
        pending ? "opacity-50" : ""
      }`}
    >
      <button
        onClick={() =>
          startTransition(() => toggleTask(task.id, !task.is_done))
        }
        aria-label={
          task.is_done ? `Reabrir ${task.title}` : `Concluir ${task.title}`
        }
        className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors"
        style={{
          borderColor: meta.color,
          backgroundColor: task.is_done ? meta.color : "transparent",
        }}
      >
        {task.is_done && (
          <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
            <path
              d="M3.5 8.5l3 3 6-6.5"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={`text-sm leading-snug ${
            task.is_done ? "text-muted line-through" : "text-ink"
          }`}
        >
          {task.title}
        </p>
        {/* A cor nunca identifica sozinha: sempre acompanha rótulo em texto. */}
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: meta.color }}
          />
          {meta.label}
          {task.recurrence && (
            <>
              <Repeat size={12} aria-hidden />
              <span>toda semana</span>
            </>
          )}
        </p>
      </div>

      <button
        onClick={() => startTransition(() => deleteTask(task.id))}
        aria-label={`Excluir ${task.title}`}
        className="shrink-0 p-1 text-muted transition-colors hover:text-red-600"
      >
        <Trash2 size={16} aria-hidden />
      </button>
    </li>
  );
}
