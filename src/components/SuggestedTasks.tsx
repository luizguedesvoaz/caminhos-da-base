"use client";

import { useTransition } from "react";
import { addSuggestedTasks } from "@/app/(app)/tarefas/actions";
import { SUGGESTED_TASKS, TASK_CATEGORIES } from "@/lib/domain/tasks";
import { Button, Card } from "@/components/ui";

/**
 * Checklist inicial sugerida pelo degrau da pirâmide.
 * Tela vazia é o pior momento de um gerenciador de tarefas — aqui ela vira
 * a primeira entrega de valor, com itens que a metodologia já recomenda.
 */
export function SuggestedTasks({
  athleteId,
  step,
}: {
  athleteId: string;
  step: number;
}) {
  const [pending, startTransition] = useTransition();
  const items = SUGGESTED_TASKS[step] ?? SUGGESTED_TASKS[1];

  return (
    <Card className="mb-6">
      <h2 className="font-semibold text-navy-900">
        Sugestões para o degrau {step}
      </h2>
      <p className="mt-1 text-sm text-muted">
        Um ponto de partida com base no momento do seu atleta. Você ajusta
        depois.
      </p>

      <ul className="my-4 space-y-2.5">
        {items.map((item) => (
          <li key={item.title} className="flex gap-2.5 text-sm">
            <span
              aria-hidden
              className="mt-1.5 size-2 shrink-0 rounded-full"
              style={{ backgroundColor: TASK_CATEGORIES[item.category].color }}
            />
            <span className="text-ink">{item.title}</span>
          </li>
        ))}
      </ul>

      <Button
        variant="gold"
        disabled={pending}
        onClick={() =>
          startTransition(() => addSuggestedTasks(athleteId, [...items]))
        }
      >
        {pending ? "Adicionando…" : "Adicionar essas tarefas"}
      </Button>
    </Card>
  );
}
