"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Pencil, RefreshCw, X } from "lucide-react";
import {
  upsertCompetition,
  deleteCompetition,
  recalculateAll,
} from "@/app/painel/actions";
import { Button, ErrorMessage, Field, inputClass } from "@/components/ui";

type Competition = {
  id: string;
  name: string;
  state: string | null;
  step_level: number;
};

/**
 * Editor do catálogo de competições — o que torna a metodologia configurável
 * sem deploy, requisito registrado desde a especificação.
 *
 * As competições variam por estado e federação, e mudam de nome entre
 * temporadas. Se isso vivesse no código, cada ajuste dependeria de programador.
 */
export function CompetitionEditor({
  competitions,
}: {
  competitions: Competition[];
}) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<string | "novo" | null>(null);
  const [form, setForm] = useState({ name: "", state: "", stepLevel: 2 });
  const [error, setError] = useState<string | null>(null);
  const [recalcResult, setRecalcResult] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function startEdit(competition: Competition) {
    setEditing(competition.id);
    setForm({
      name: competition.name,
      state: competition.state ?? "",
      stepLevel: competition.step_level,
    });
    setError(null);
  }

  function startNew() {
    setEditing("novo");
    setForm({ name: "", state: "", stepLevel: 2 });
    setError(null);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await upsertCompetition(
        editing === "novo" ? null : editing,
        form.name,
        form.state,
        form.stepLevel,
      );
      if (!result.ok) setError(result.error ?? "Falhou.");
      else setEditing(null);
    });
  }

  function remove(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteCompetition(id);
      if (!result.ok) setError(result.error ?? "Falhou.");
      setConfirmDelete(null);
    });
  }

  function recalc() {
    setError(null);
    setRecalcResult(null);
    startTransition(async () => {
      const result = await recalculateAll();
      if (result.error) setError(result.error);
      else
        setRecalcResult(
          `${result.count} ${result.count === 1 ? "atleta reavaliado" : "atletas reavaliados"}.`,
        );
    });
  }

  const byStep = [3, 2, 1].map((level) => ({
    level,
    items: competitions.filter((c) => c.step_level === level),
  }));

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-navy-900">
          Competições ({competitions.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={startNew}
            className="inline-flex items-center gap-1.5 rounded-xl bg-navy-900 px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus size={15} aria-hidden />
            Nova competição
          </button>
          <button
            onClick={recalc}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-4 py-2 text-sm text-ink disabled:opacity-50"
          >
            <RefreshCw size={15} aria-hidden />
            {pending ? "Recalculando…" : "Recalcular todos"}
          </button>
        </div>
      </div>

      {/* Mudar a tabela não muda o degrau de ninguém automaticamente — quem já
          foi avaliado mantém o resultado antigo até o recálculo. */}
      <p className="mb-3 text-xs leading-relaxed text-muted">
        Depois de alterar competições, use <strong>Recalcular todos</strong> para
        aplicar a mudança aos atletas já cadastrados. Sem isso, o novo critério
        só valeria para quem se cadastrar a partir de agora.
      </p>

      {recalcResult && (
        <p className="mb-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {recalcResult}
        </p>
      )}

      <ErrorMessage>{error}</ErrorMessage>

      {editing && (
        <div className="mb-4 rounded-2xl border border-navy-300 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-semibold text-navy-900">
              {editing === "novo" ? "Nova competição" : "Editar competição"}
            </h4>
            <button onClick={() => setEditing(null)} aria-label="Fechar">
              <X size={20} className="text-muted" aria-hidden />
            </button>
          </div>

          <div className="space-y-3">
            <Field label="Nome da competição">
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Campeonato Mineiro Sub-15"
                className={inputClass}
              />
            </Field>

            <Field label="Estado (opcional)" hint="Sigla, ex: SP, MG, RS">
              <input
                value={form.state}
                onChange={(e) =>
                  setForm((f) => ({ ...f, state: e.target.value.toUpperCase() }))
                }
                maxLength={2}
                className={inputClass}
              />
            </Field>

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-ink">
                Que degrau esta competição comprova?
              </legend>
              <div className="space-y-1.5">
                {[
                  { value: 3, label: "Degrau 3 — estadual de base, alto rendimento" },
                  { value: 2, label: "Degrau 2 — competição regional organizada" },
                  { value: 1, label: "Degrau 1 — festival ou amistoso, sem peso" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-line p-3 text-sm has-checked:border-navy-900 has-checked:bg-navy-50"
                  >
                    <input
                      type="radio"
                      checked={form.stepLevel === option.value}
                      onChange={() =>
                        setForm((f) => ({ ...f, stepLevel: option.value }))
                      }
                      className="size-4 shrink-0 accent-navy-900"
                    />
                    <span className="text-ink">{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <Button disabled={pending || !form.name.trim()} onClick={save}>
                {pending ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {byStep.map(({ level, items }) => (
          <div key={level}>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Degrau {level} · {items.length}
            </h4>
            {items.length === 0 ? (
              <p className="rounded-xl border border-line bg-white p-4 text-sm text-muted">
                Nenhuma competição neste degrau.
              </p>
            ) : (
              <ul className="space-y-2">
                {items.map((competition) => (
                  <li
                    key={competition.id}
                    className="flex items-center gap-3 rounded-xl border border-line bg-white p-3.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink">{competition.name}</p>
                      {competition.state && (
                        <p className="text-xs text-muted">{competition.state}</p>
                      )}
                    </div>

                    {confirmDelete === competition.id ? (
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted"
                        >
                          Não
                        </button>
                        <button
                          onClick={() => remove(competition.id)}
                          disabled={pending}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Excluir
                        </button>
                      </div>
                    ) : (
                      <div className="flex shrink-0 gap-1">
                        <button
                          onClick={() => startEdit(competition)}
                          aria-label={`Editar ${competition.name}`}
                          className="p-1.5 text-muted hover:text-navy-900"
                        >
                          <Pencil size={15} aria-hidden />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(competition.id)}
                          aria-label={`Excluir ${competition.name}`}
                          className="p-1.5 text-muted hover:text-red-600"
                        >
                          <Trash2 size={15} aria-hidden />
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
