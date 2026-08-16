import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Pyramid } from "@/components/Pyramid";
import { Card, LinkButton, formatCents } from "@/components/ui";
import { STEPS, NEXT_STEP_CHECKLIST, type Step } from "@/lib/domain/pyramid";
import {
  categoryFor,
  categoryLabel,
  categoryYear,
  currentSeason,
} from "@/lib/domain/category";
import { BRAND } from "@/lib/config";

export default async function InicioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: athletes } = await supabase
    .from("athletes")
    .select("id, full_name, birth_year, current_club_name")
    .is("deleted_at", null)
    .order("created_at");

  // Nenhum atleta ainda: manda para o onboarding.
  if (!athletes || athletes.length === 0) redirect("/onboarding");

  const athlete = athletes[0];
  const season = currentSeason();
  const category = categoryFor(athlete.birth_year, season);
  const yearInCategory = categoryYear(athlete.birth_year, season);
  const firstName = athlete.full_name.split(" ")[0];

  const { data: evaluation } = await supabase
    .rpc("current_pyramid_step", { p_athlete_id: athlete.id })
    .single<{ step: number; reason: string }>();
  const step = (evaluation?.step ?? 1) as Step;

  const { data: invested } = await supabase.rpc("total_invested_cents", {
    p_athlete_id: athlete.id,
  });

  return (
    <main className="mx-auto min-h-dvh max-w-md px-6 py-8 pb-24">
      <header className="mb-6">
        <p className="text-sm text-muted">{BRAND.name}</p>
        <h1 className="text-2xl font-bold text-navy-900">{firstName}</h1>
        <p className="text-sm text-muted">
          {categoryLabel(category)}
          {yearInCategory &&
            ` · ${yearInCategory === "primeiro" ? "1º" : "2º"} ano`}
          {athlete.current_club_name && ` · ${athlete.current_club_name}`}
        </p>
      </header>

      {/* A pirâmide é o elemento visual mais forte da tela inicial. */}
      <Card className="bg-navy-900 text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-gold-400">
          Degrau {step} de 3
        </p>
        <h2 className="mt-1 text-xl font-bold">{STEPS[step].name}</h2>
        <div className="mx-auto my-6 w-48">
          <Pyramid step={step} />
        </div>
        {evaluation?.reason && (
          <p className="text-sm leading-relaxed text-white/70">
            {evaluation.reason}
          </p>
        )}
      </Card>

      {step < 3 && (
        <Card className="mt-4">
          <h2 className="font-semibold text-navy-900">
            O que falta para o próximo degrau
          </h2>
          <ul className="mt-3 space-y-2.5">
            {NEXT_STEP_CHECKLIST[step].slice(0, 3).map((item) => (
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

      <Card className="mt-4">
        <p className="text-sm text-muted">Total investido até aqui</p>
        <p className="mt-1 text-3xl font-bold text-navy-900">
          {formatCents(Number(invested ?? 0))}
        </p>
        <p className="mt-2 text-xs text-muted">
          O lançamento de gastos chega na próxima etapa do app.
        </p>
      </Card>

      {athletes.length > 1 && (
        <Card className="mt-4">
          <h2 className="font-semibold text-navy-900">Outros atletas</h2>
          <ul className="mt-2 space-y-1">
            {athletes.slice(1).map((a) => (
              <li key={a.id} className="text-sm text-muted">
                {a.full_name}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-8 space-y-3">
        <LinkButton href="/onboarding" variant="ghost">
          Cadastrar outro atleta
        </LinkButton>
        <Link
          href="/sair"
          className="block text-center text-sm text-muted underline"
        >
          Sair da conta
        </Link>
      </div>
    </main>
  );
}
