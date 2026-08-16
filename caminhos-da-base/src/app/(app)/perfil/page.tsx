import Link from "next/link";
import { FileText, LogOut, MessageCircle, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getActiveAthlete } from "@/lib/athlete";
import { AthleteHeader } from "@/components/AthleteHeader";
import { Card } from "@/components/ui";
import { BRAND } from "@/lib/config";
import { STEPS, type Step } from "@/lib/domain/pyramid";
import {
  categoryFor,
  categoryLabel,
  categoryYear,
  categoryYearExplanation,
  canSignFormationContract,
  currentSeason,
} from "@/lib/domain/category";

export default async function PerfilPage() {
  const { athlete, all } = await getActiveAthlete();
  const supabase = await createClient();
  const season = currentSeason();

  const [{ data: evaluation }, { data: competitions }, { data: profile }] =
    await Promise.all([
      supabase
        .rpc("current_pyramid_step", { p_athlete_id: athlete.id })
        .single<{ step: number; reason: string }>(),
      supabase
        .from("athlete_competitions")
        .select("competition_name, season_year")
        .eq("athlete_id", athlete.id)
        .order("season_year", { ascending: false }),
      supabase.from("profiles").select("full_name").maybeSingle(),
    ]);

  const step = (evaluation?.step ?? 1) as Step;
  const category = categoryFor(athlete.birth_year, season);
  const yearInCategory = categoryYear(athlete.birth_year, season);
  const canSign = canSignFormationContract(athlete.birth_year, season);

  return (
    <>
      <AthleteHeader athlete={athlete} all={all} subtitle="Perfil do atleta" />

      <Card>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Nome</dt>
            <dd className="text-right text-ink">{athlete.full_name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Ano de nascimento</dt>
            <dd className="text-right tabular-nums text-ink">
              {athlete.birth_year}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Categoria em {season}</dt>
            <dd className="text-right text-ink">{categoryLabel(category)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Posição</dt>
            <dd className="text-right text-ink">
              {athlete.position ?? "Não definida"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Clube atual</dt>
            <dd className="text-right text-ink">
              {athlete.current_club_name ?? "Não informado"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Degrau</dt>
            <dd className="text-right text-ink">
              {step} — {STEPS[step].name}
            </dd>
          </div>
        </dl>
      </Card>

      <Card className="mt-4">
        <h2 className="font-semibold text-navy-900">
          Ano na categoria
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {categoryYearExplanation(yearInCategory, category)}
        </p>
      </Card>

      {/* Card informativo que aparece sozinho aos 14 anos — Lei Pelé. */}
      {canSign && (
        <Card className="mt-4 border-gold-500 bg-gold-500/10">
          <h2 className="font-semibold text-navy-900">
            Atenção: idade de contrato de formação
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            A partir dos 14 anos, um clube pode oferecer contrato de formação ao
            atleta. É o momento em que vínculo e direitos passam a ter peso real
            de carreira — e em que vale conversar com quem entende do assunto
            antes de assinar qualquer coisa.
          </p>
        </Card>
      )}

      {competitions && competitions.length > 0 && (
        <Card className="mt-4">
          <h2 className="font-semibold text-navy-900">Competições registradas</h2>
          <ul className="mt-3 space-y-2">
            {competitions.map((c, i) => (
              <li
                key={`${c.competition_name}-${i}`}
                className="flex justify-between gap-3 text-sm"
              >
                <span className="text-ink">{c.competition_name}</span>
                <span className="shrink-0 tabular-nums text-muted">
                  {c.season_year}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="mt-4">
        <h2 className="font-semibold text-navy-900">Falar com o consultor</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Dúvida sobre o momento do seu atleta, vínculo ou próximo passo?
        </p>
        <a
          href={BRAND.consultantContactUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-navy-900 underline"
        >
          <MessageCircle size={16} aria-hidden />
          Solicitar avaliação
        </a>
      </Card>

      <div className="mt-6 space-y-2">
        <Link
          href="/documentos"
          className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3.5 text-sm font-semibold text-ink"
        >
          <FileText size={16} aria-hidden />
          Documentos e vínculo federativo
        </Link>
        <Link
          href="/onboarding"
          className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3.5 text-sm font-semibold text-ink"
        >
          <Plus size={16} aria-hidden />
          Cadastrar outro atleta
        </Link>
        <Link
          href="/sair"
          className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3.5 text-sm text-muted"
        >
          <LogOut size={16} aria-hidden />
          Sair da conta
          {profile?.full_name && (
            <span className="ml-auto truncate text-xs">{profile.full_name}</span>
          )}
        </Link>
      </div>
    </>
  );
}
