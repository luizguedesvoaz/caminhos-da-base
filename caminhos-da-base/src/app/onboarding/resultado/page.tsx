import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Pyramid } from "@/components/Pyramid";
import { Card, LinkButton } from "@/components/ui";
import { STEPS, NEXT_STEP_CHECKLIST, type Step } from "@/lib/domain/pyramid";
import {
  categoryFor,
  categoryLabel,
  categoryYear,
  categoryYearExplanation,
  currentSeason,
} from "@/lib/domain/category";

export default async function ResultadoPage({
  searchParams,
}: {
  searchParams: Promise<{ atleta?: string }>;
}) {
  const { atleta } = await searchParams;
  if (!atleta) redirect("/onboarding");

  const supabase = await createClient();

  const { data: athlete } = await supabase
    .from("athletes")
    .select("id, full_name, birth_year")
    .eq("id", atleta)
    .single();

  if (!athlete) redirect("/onboarding");

  // Degrau calculado no servidor pela engine — nunca no navegador.
  const { data: evaluation } = await supabase
    .rpc("current_pyramid_step", { p_athlete_id: atleta })
    .single<{ step: number; reason: string }>();

  const step = (evaluation?.step ?? 1) as Step;
  const season = currentSeason();
  const category = categoryFor(athlete.birth_year, season);
  const yearInCategory = categoryYear(athlete.birth_year, season);
  const firstName = athlete.full_name.split(" ")[0];

  return (
    <main className="mx-auto min-h-dvh max-w-md px-6 py-10">
      <p className="text-sm font-semibold uppercase tracking-wide text-gold-600">
        Degrau {step} de 3
      </p>
      <h1 className="mt-1 text-3xl font-bold leading-tight text-navy-900">
        {firstName} está em {STEPS[step].name}
      </h1>

      <div className="mx-auto my-8 w-60">
        <Pyramid step={step} />
      </div>

      <Card>
        <p className="leading-relaxed text-ink">{STEPS[step].meaning}</p>
        {evaluation?.reason && (
          <p className="mt-4 border-t border-line pt-4 text-sm text-muted">
            <span className="font-semibold text-ink">Por que este degrau: </span>
            {evaluation.reason}
          </p>
        )}
      </Card>

      <Card className="mt-4">
        <h2 className="font-semibold text-navy-900">
          Categoria em {season}: {categoryLabel(category)}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {categoryYearExplanation(yearInCategory, category)}
        </p>
      </Card>

      {step < 3 && (
        <Card className="mt-4">
          <h2 className="font-semibold text-navy-900">
            O que falta para o próximo degrau
          </h2>
          <ul className="mt-3 space-y-2.5">
            {NEXT_STEP_CHECKLIST[step].map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed">
                <span
                  aria-hidden
                  className="mt-1.5 size-2 shrink-0 rounded-full bg-gold-500"
                />
                <span className="text-ink">{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-8">
        <LinkButton href="/inicio" variant="gold">
          Ir para o início
        </LinkButton>
      </div>
    </main>
  );
}
