"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { createTask, type TaskState } from "@/app/(app)/tarefas/actions";
import {
  TASK_CATEGORIES,
  TASK_CATEGORY_KEYS,
  WEEKDAYS,
  toISODate,
} from "@/lib/domain/tasks";
import { Button, ErrorMessage, Field, inputClass } from "@/components/ui";
import { BotaoFlutuante } from "@/components/BotaoFlutuante";

export function NewTaskForm({ athleteId }: { athleteId: string }) {
  const [open, setOpen] = useState(false);
  const [repeats, setRepeats] = useState(false);
  const [state, formAction, pending] = useActionState<TaskState, FormData>(
    createTask,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setRepeats(false);
      setOpen(false);
    }
  }, [state.ok]);

  if (!open) {
    return (
      <BotaoFlutuante onClick={() => setOpen(true)}>
        Nova tarefa
      </BotaoFlutuante>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40">
      <div className="max-h-[88dvh] w-full overflow-y-auto rounded-t-[24px] border-t-2 border-contorno bg-fundo p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-tinta">Nova tarefa</h2>
          <button onClick={() => setOpen(false)} aria-label="Fechar">
            <X size={22} className="text-tinta-2" aria-hidden />
          </button>
        </div>

        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="athleteId" value={athleteId} />

          <Field label="O que precisa ser feito?">
            <input
              name="title"
              required
              autoFocus
              placeholder="Ex: levar atestado no treino"
              className={inputClass}
            />
          </Field>

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-tinta">
              Categoria
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {TASK_CATEGORY_KEYS.map((key, index) => {
                const meta = TASK_CATEGORIES[key];
                return (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-contorno p-3 text-sm has-checked:border-contorno-forte has-checked:bg-fundo-2"
                  >
                    <input
                      type="radio"
                      name="category"
                      value={key}
                      required
                      defaultChecked={index === 0}
                      className="sr-only"
                    />
                    <span
                      aria-hidden
                      className="size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                    <span className="text-tinta">{meta.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <Field label="Quando">
            <input
              type="date"
              name="dueDate"
              defaultValue={toISODate(new Date())}
              className={inputClass}
            />
          </Field>

          <label className="flex items-center gap-3 rounded-xl bg-fundo-2 p-3.5">
            <input
              type="checkbox"
              checked={repeats}
              onChange={(e) => setRepeats(e.target.checked)}
              className="size-5 shrink-0 accent-acento"
            />
            <span className="text-sm text-tinta">Repete toda semana</span>
          </label>

          {repeats && (
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-tinta">
                Em quais dias?
              </legend>
              <div className="flex gap-1.5">
                {WEEKDAYS.map((day) => (
                  <label key={day.value} className="flex-1">
                    <input
                      type="checkbox"
                      name="weekdays"
                      value={day.value}
                      className="peer sr-only"
                    />
                    <span
                      title={day.label}
                      className="flex h-11 cursor-pointer items-center justify-center rounded-lg border border-contorno text-sm text-tinta-2 peer-checked:border-contorno-forte peer-checked:bg-marinho-fundo peer-checked:text-white"
                    >
                      {day.short}
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-tinta-2">
                Serão criadas as tarefas das próximas 8 semanas.
              </p>
            </fieldset>
          )}

          <ErrorMessage>{state.error}</ErrorMessage>

          <Button type="submit" disabled={pending}>
            {pending ? "Salvando…" : "Salvar tarefa"}
          </Button>
        </form>
      </div>
    </div>
  );
}
