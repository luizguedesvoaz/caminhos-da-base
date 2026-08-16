"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import {
  createExpense,
  type ExpenseState,
} from "@/app/(app)/financeiro/actions";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_KEYS,
} from "@/lib/domain/expenses";
import { toISODate } from "@/lib/domain/tasks";
import { Button, ErrorMessage, Field, inputClass } from "@/components/ui";

/**
 * Meta de UX: lançar um gasto em menos de 30 segundos.
 * Por isso o valor abre com o teclado numérico e o foco já nele; categoria e
 * data têm padrões razoáveis; observação é opcional e fica por último.
 */
export function NewExpenseForm({ athleteId }: { athleteId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ExpenseState, FormData>(
    createExpense,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setOpen(false);
    }
  }, [state.ok]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-navy-900 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-navy-900/25"
      >
        <Plus size={18} aria-hidden />
        Lançar gasto
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40">
      <div className="max-h-[88dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy-900">Lançar gasto</h2>
          <button onClick={() => setOpen(false)} aria-label="Fechar">
            <X size={22} className="text-muted" aria-hidden />
          </button>
        </div>

        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="athleteId" value={athleteId} />

          <Field label="Quanto foi?" hint="Pode digitar 150 ou 150,50">
            <input
              name="amount"
              required
              autoFocus
              inputMode="decimal"
              placeholder="R$ 0,00"
              className={`${inputClass} text-2xl font-bold`}
            />
          </Field>

          <Field label="Do que se trata?">
            <select name="category" required className={inputClass} defaultValue="mensalidade">
              {EXPENSE_CATEGORY_KEYS.map((key) => (
                <option key={key} value={key}>
                  {EXPENSE_CATEGORIES[key].label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Quando">
            <input
              type="date"
              name="spentOn"
              defaultValue={toISODate(new Date())}
              className={inputClass}
            />
          </Field>

          <Field label="Observação (opcional)">
            <input
              name="note"
              placeholder="Ex: chuteira society"
              className={inputClass}
            />
          </Field>

          <ErrorMessage>{state.error}</ErrorMessage>

          <Button type="submit" variant="gold" disabled={pending}>
            {pending ? "Salvando…" : "Salvar gasto"}
          </Button>
        </form>
      </div>
    </div>
  );
}
