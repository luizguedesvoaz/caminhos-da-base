"use client";

import { useActionState, useState } from "react";
import { createAthlete, type OnboardingState } from "./actions";
import { Button, ErrorMessage, Field, inputClass } from "@/components/ui";
import {
  categoryLabel,
  categoryFor,
  categoryYear,
  currentSeason,
} from "@/lib/domain/category";

type Competition = { id: string; name: string; step_level: number };

const POSITIONS = [
  "Goleiro",
  "Lateral",
  "Zagueiro",
  "Volante",
  "Meia",
  "Ponta",
  "Atacante",
];

export function OnboardingForm({
  competitions,
}: {
  competitions: Competition[];
}) {
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(
    createAthlete,
    {},
  );
  const [step, setStep] = useState(0);
  const [birthYear, setBirthYear] = useState("");

  const season = currentSeason();
  const years = Array.from({ length: 16 }, (_, i) => season - 5 - i);

  const parsedYear = Number(birthYear);
  const category = birthYear ? categoryFor(parsedYear, season) : null;
  const yearInCategory = birthYear ? categoryYear(parsedYear, season) : null;

  return (
    <main className="mx-auto min-h-dvh max-w-md px-6 py-10">
      <div className="mb-8 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i <= step ? "bg-gold-500" : "bg-navy-900/15"
            }`}
          />
        ))}
      </div>

      <form action={formAction} className="space-y-5">
        {/* ---------- Passo 1: o mínimo obrigatório ---------- */}
        <div className={step === 0 ? "space-y-5" : "hidden"}>
          <div>
            <h1 className="text-2xl font-bold text-navy-900">
              Vamos começar pelo atleta
            </h1>
            <p className="mt-2 text-muted">
              Só duas informações agora. O resto você completa depois.
            </p>
          </div>

          <Field label="Nome do atleta">
            <input
              name="fullName"
              required
              autoComplete="off"
              className={inputClass}
            />
          </Field>

          <Field
            label="Ano de nascimento"
            hint="No futebol de base, a categoria é definida pelo ano de nascimento — não pela idade."
          >
            <select
              name="birthYear"
              required
              className={inputClass}
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
            >
              <option value="">Selecione</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </Field>

          {category && (
            <div className="rounded-xl bg-navy-50 p-4 text-sm">
              <p className="font-semibold text-navy-900">
                Em {season}, joga o {categoryLabel(category)}
              </p>
              <p className="mt-1 text-muted">
                {yearInCategory === "primeiro"
                  ? "É um dos mais novos da categoria — primeiro ano."
                  : "É um dos mais velhos da categoria — segundo ano."}
              </p>
            </div>
          )}

          <Button
            type="button"
            onClick={() => setStep(1)}
            disabled={!birthYear}
          >
            Continuar
          </Button>
        </div>

        {/* ---------- Passo 2: clube ---------- */}
        <div className={step === 1 ? "space-y-5" : "hidden"}>
          <div>
            <h1 className="text-2xl font-bold text-navy-900">Onde ele joga?</h1>
            <p className="mt-2 text-muted">
              Se ainda não joga em lugar nenhum, é só pular.
            </p>
          </div>

          <Field label="Clube, escolinha ou projeto">
            <input name="clubName" className={inputClass} autoComplete="off" />
          </Field>

          <Field label="Que tipo de lugar é?">
            <select name="clubKind" className={inputClass} defaultValue="">
              <option value="">Não sei / prefiro não informar</option>
              <option value="escolinha">Escolinha de futebol</option>
              <option value="projeto_social">Projeto social</option>
              <option value="clube">Clube</option>
              <option value="clube_formador">
                Clube com Certificado de Clube Formador
              </option>
            </select>
          </Field>

          <Field label="Posição">
            <select name="position" className={inputClass} defaultValue="">
              <option value="">Ainda não definida</option>
              {POSITIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>

          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setStep(0)}>
              Voltar
            </Button>
            <Button type="button" onClick={() => setStep(2)}>
              Continuar
            </Button>
          </div>
        </div>

        {/* ---------- Passo 3: competições (define o degrau) ---------- */}
        <div className={step === 2 ? "space-y-5" : "hidden"}>
          <div>
            <h1 className="text-2xl font-bold text-navy-900">
              Ele disputa alguma competição?
            </h1>
            <p className="mt-2 text-muted">
              Marque todas que ele já jogou. É isso que define o degrau na
              pirâmide.
            </p>
          </div>

          <div className="max-h-80 space-y-2 overflow-y-auto rounded-xl border border-line p-2">
            {competitions.map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-3 rounded-lg p-3 hover:bg-navy-50"
              >
                <input
                  type="checkbox"
                  name="competitions"
                  value={c.name}
                  className="size-5 shrink-0 accent-navy-900"
                />
                <span className="text-sm text-ink">{c.name}</span>
              </label>
            ))}
            {competitions.length === 0 && (
              <p className="p-3 text-sm text-muted">
                Nenhuma competição cadastrada ainda.
              </p>
            )}
          </div>

          <p className="text-sm text-muted">
            Não achou a competição dele? Sem problema — você adiciona depois no
            perfil do atleta.
          </p>

          <ErrorMessage>{state.error}</ErrorMessage>

          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setStep(1)}>
              Voltar
            </Button>
            <Button type="submit" variant="gold" disabled={pending}>
              {pending ? "Calculando…" : "Ver o degrau"}
            </Button>
          </div>
        </div>
      </form>
    </main>
  );
}
