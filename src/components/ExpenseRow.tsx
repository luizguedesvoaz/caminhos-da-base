"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteExpense } from "@/app/(app)/financeiro/actions";
import { formatCents } from "@/lib/domain/expenses";

export function ExpenseRow({
  id,
  amountCents,
  categoryLabel,
  spentOn,
  note,
}: {
  id: string;
  amountCents: number;
  categoryLabel: string;
  spentOn: string;
  note: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [y, m, d] = spentOn.split("-");

  return (
    <li
      className={`flex items-center gap-3 rounded-xl border border-line bg-white p-3.5 ${
        pending ? "opacity-50" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm text-ink">{categoryLabel}</p>
        <p className="text-xs text-muted">
          {d}/{m}/{y}
          {note && ` · ${note}`}
        </p>
      </div>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
        {formatCents(amountCents)}
      </span>
      <button
        onClick={() => startTransition(() => deleteExpense(id))}
        aria-label="Excluir lançamento"
        className="shrink-0 p-1 text-muted transition-colors hover:text-red-600"
      >
        <Trash2 size={16} aria-hidden />
      </button>
    </li>
  );
}
