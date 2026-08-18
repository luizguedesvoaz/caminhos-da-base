import Link from "next/link";
import { FileText, LogOut, MessageCircle, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getActiveAthlete } from "@/lib/athlete";
import { AthleteHeader } from "@/components/AthleteHeader";
import { Card } from "@/components/ui";
import { ScoutingToggle } from "@/components/ScoutingToggle";
import { SeletorTema } from "@/components/SeletorTema";
import { Insignia } from "@/components/Divisa";
import { lerTema } from "@/lib/tema-server";
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
  const tema = await lerTema();

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
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <AthleteHeader athlete={athlete} all={all} subtitle="Perfil do atleta" />
        </div>
        {/* A mesma figura do ícone do app: a pessoa olha a tela de início do
            celular e lembra em que degrau o filho está. */}
        <Insignia degrau={step} tamanho={30} className="mt-1 shrink-0" />
      </div>

      <Card>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-tinta-2">Nome</dt>
            <dd className="text-right text-tinta">{athlete.full_name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-tinta-2">Ano de nascimento</dt>
            <dd className="text-right tabular-nums text-tinta">
              {athlete.birth_year}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-tinta-2">Categoria em {season}</dt>
            <dd className="text-right text-tinta">{categoryLabel(category)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-tinta-2">Posição</dt>
            <dd className="text-right text-tinta">
              {athlete.position ?? "Não definida"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-tinta-2">Clube atual</dt>
            <dd className="text-right text-tinta">
              {athlete.current_club_name ?? "Não informado"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-tinta-2">Degrau</dt>
            <dd className="text-right text-tinta">
              {step} — {STEPS[step].name}
            </dd>
          </div>
        </dl>
      </Card>

      <Card className="mt-4">
        <h2 className="font-semibold text-tinta">
          Ano na categoria
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-tinta-2">
          {categoryYearExplanation(yearInCategory, category)}
        </p>
      </Card>

      {/* Card informativo que aparece sozinho aos 14 anos — Lei Pelé. */}
      {canSign && (
        <Card className="mt-4 border-jogo bg-jogo/10">
          <h2 className="font-semibold text-tinta">
            Atenção: idade de contrato de formação
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-tinta">
            A partir dos 14 anos, um clube pode oferecer contrato de formação ao
            atleta. É o momento em que vínculo e direitos passam a ter peso real
            de carreira — e em que vale conversar com quem entende do assunto
            antes de assinar qualquer coisa.
          </p>
        </Card>
      )}

      {competitions && competitions.length > 0 && (
        <Card className="mt-4">
          <h2 className="font-semibold text-tinta">Competições registradas</h2>
          <ul className="mt-3 space-y-2">
            {competitions.map((c, i) => (
              <li
                key={`${c.competition_name}-${i}`}
                className="flex justify-between gap-3 text-sm"
              >
                <span className="text-tinta">{c.competition_name}</span>
                <span className="shrink-0 tabular-nums text-tinta-2">
                  {c.season_year}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <ScoutingToggle
        athleteId={athlete.id}
        visible={athlete.scouting_visible ?? true}
        athleteName={athlete.full_name.split(" ")[0]}
      />

      <Card className="mt-4">
        <h2 className="font-semibold text-tinta">Falar com o consultor</h2>
        <p className="mt-2 text-sm leading-relaxed text-tinta-2">
          Dúvida sobre o momento do seu atleta, vínculo ou próximo passo?
        </p>
        <a
          href={BRAND.consultantContactUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-tinta underline"
        >
          <MessageCircle size={16} aria-hidden />
          Solicitar avaliação
        </a>
      </Card>

      <Card className="mt-4">
        <SeletorTema inicial={tema} />
      </Card>

      <div className="mt-6 space-y-2">
        <Link
          href="/documentos" prefetch={false}
          className="flex items-center gap-2 rounded-xl border border-contorno bg-fundo px-4 py-3.5 text-sm font-semibold text-tinta"
        >
          <FileText size={16} aria-hidden />
          Documentos e vínculo federativo
        </Link>
        <Link
          href="/onboarding" prefetch={false}
          className="flex items-center gap-2 rounded-xl border border-contorno bg-fundo px-4 py-3.5 text-sm font-semibold text-tinta"
        >
          <Plus size={16} aria-hidden />
          Cadastrar outro atleta
        </Link>
        <Link
          href="/sair" prefetch={false}
          className="flex items-center gap-2 rounded-xl border border-contorno bg-fundo px-4 py-3.5 text-sm text-tinta-2"
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
