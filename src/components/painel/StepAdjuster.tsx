"use client";

import { useState, useTransition } from "react";
import { setAthleteStep } from "@/app/painel/actions";
import { Button, ErrorMessage, inputClass } from "@/components/ui";
import { STEPS, type Step } from "@/lib/domain/pyramid";

/**
 * Ajuste manual de degrau.
 *
 * A observação é obrigatória: um degrau alterado sem motivo registrado é
 * indefensável seis meses depois, quando ninguém lembra por que aquele atleta
 * está fora do que a regra automática indicaria.
 *
 * O ajuste não apaga a avaliação automática — entra como um novo registro no
 * histórico, e o mais recente é o que vale.
 */
export function StepAdjuster({
  athleteId,
  currentStep,
}: {
  athleteId: string;
  currentStep: Step;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(currentStep);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await setAthleteStep(athleteId, step, note);
      if (!result.ok) setError(result.error ?? "Falhou.");
      else {
        setDone(true);
        setOpen(false);
        setNote("");
      }
    });
  }

  if (!open) {
    return (
      <>
        {done && (
          <p className="mb-2 text-sm text-emerald-700">Degrau ajustado.</p>
        )}
        <Button variant="ghost" onClick={() => setOpen(true)}>
          Ajustar degrau manualmente
        </Button>
      </>
    );
  }

  return (
    <div className="space-y-3">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-tinta">Novo degrau</legend>
        <div className="space-y-1.5">
          {([3, 2, 1] as Step[]).map((value) => (
            <label
              key={value}
              className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-contorno p-3 has-checked:border-contorno-forte has-checked:bg-fundo-2"
            >
              <input
                type="radio"
                name="step"
                checked={step === value}
                onChange={() => setStep(value)}
                className="mt-0.5 size-4 shrink-0 accent-acento"
              />
              <span className="text-sm">
                <span className="font-semibold text-tinta">
                  {value} — {STEPS[value].name}
                </span>
                {value === currentStep && (
                  <span className="ml-1.5 text-xs text-tinta-2">(atual)</span>
                )}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-tinta">
          Motivo do ajuste
        </label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ex: entrou no sub-15 do Corinthians, ainda sem registro no app"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-tinta-2">
          Obrigatório. Fica no histórico do atleta, com sua assinatura e data.
        </p>
      </div>

      <ErrorMessage>{error}</ErrorMessage>

      <div className="flex gap-2">
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
        <Button disabled={pending || !note.trim()} onClick={save}>
          {pending ? "Salvando…" : "Salvar ajuste"}
        </Button>
      </div>
    </div>
  );
}
