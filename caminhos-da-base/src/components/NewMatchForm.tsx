"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { createMatch, type MatchState } from "@/app/(app)/temporada/actions";
import { toISODate } from "@/lib/domain/tasks";
import { Button, ErrorMessage, Field, inputClass } from "@/components/ui";

export function NewMatchForm({ athleteId }: { athleteId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<MatchState, FormData>(
    createMatch,
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
        Registrar jogo
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40">
      <div className="max-h-[88dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy-900">Registrar jogo</h2>
          <button onClick={() => setOpen(false)} aria-label="Fechar">
            <X size={22} className="text-muted" aria-hidden />
          </button>
        </div>

        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="athleteId" value={athleteId} />

          <Field label="Data do jogo">
            <input
              type="date"
              name="playedOn"
              required
              defaultValue={toISODate(new Date())}
              className={inputClass}
            />
          </Field>

          <Field
            label="Minutos em campo"
            hint="O dado mais importante. Se ficou no banco sem entrar, coloque 0."
          >
            <input
              type="number"
              name="minutes"
              min={0}
              max={120}
              inputMode="numeric"
              placeholder="Ex: 45"
              className={`${inputClass} text-2xl font-bold`}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Gols">
              <input
                type="number"
                name="goals"
                min={0}
                defaultValue={0}
                inputMode="numeric"
                className={inputClass}
              />
            </Field>
            <Field label="Assistências">
              <input
                type="number"
                name="assists"
                min={0}
                defaultValue={0}
                inputMode="numeric"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Adversário (opcional)">
            <input name="opponent" placeholder="Ex: Portuguesa" className={inputClass} />
          </Field>

          <Field label="Competição (opcional)">
            <input
              name="competition"
              placeholder="Ex: Campeonato Paulista Sub-13"
              className={inputClass}
            />
          </Field>

          <Field
            label="Link do vídeo (opcional)"
            hint="Cole o link do YouTube e o jogo toca dentro do app."
          >
            <input
              name="videoUrl"
              type="url"
              inputMode="url"
              placeholder="https://youtube.com/watch?v=..."
              className={inputClass}
            />
          </Field>

          <Field label="Observação (opcional)">
            <input
              name="notes"
              placeholder="Ex: entrou no segundo tempo"
              className={inputClass}
            />
          </Field>

          <ErrorMessage>{state.error}</ErrorMessage>

          <Button type="submit" variant="gold" disabled={pending}>
            {pending ? "Salvando…" : "Salvar jogo"}
          </Button>
        </form>
      </div>
    </div>
  );
}
