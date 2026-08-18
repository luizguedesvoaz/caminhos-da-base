import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveAthlete } from "@/lib/athlete";
import { SeasonStatsCard } from "@/components/SeasonStats";
import { MatchRow } from "@/components/MatchRow";
import { NewMatchForm } from "@/components/NewMatchForm";
import { Bloco, Rotulo, TituloBloco, TituloTela } from "@/components/ui";
import { summarize, type Match } from "@/lib/domain/season";
import { categoryFor, categoryLabel, currentSeason } from "@/lib/domain/category";

export default async function TemporadaPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string }>;
}) {
  const { ano } = await searchParams;
  const { athlete } = await getActiveAthlete();
  const supabase = await createClient();

  const thisSeason = currentSeason();
  const season = Number(ano) || thisSeason;

  const { data } = await supabase
    .from("matches")
    .select(
      "id, played_on, opponent, competition_name, minutes_played, goals, assists, video_url, notes, season_year",
    )
    .eq("athlete_id", athlete.id)
    .is("deleted_at", null)
    .order("played_on", { ascending: false })
    .limit(300);

  const allMatches = data ?? [];
  const seasons = [
    ...new Set([thisSeason, ...allMatches.map((m) => m.season_year)]),
  ].sort((a, b) => b - a);

  // Recentes primeiro na lista; cronológico no gráfico.
  const matches = allMatches.filter((m) => m.season_year === season) as Match[];
  const cronologico = [...matches].reverse();
  const stats = summarize(matches);

  return (
    <>
      <header>
        <TituloTela>Temporada</TituloTela>
        <p className="mt-1.5 text-sm text-tinta-2">
          {athlete.full_name.split(" ")[0]} ·{" "}
          {categoryLabel(categoryFor(athlete.birth_year, season))}
        </p>
      </header>

      {seasons.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {seasons.map((year) => (
            <Link
              key={year}
              href={`/temporada?ano=${year}`}
              prefetch={false}
              aria-current={year === season ? "page" : undefined}
              className={`flex min-h-11 shrink-0 items-center rounded-full border-2 px-4 text-[15px] font-bold tabular ${
                year === season
                  ? "border-contorno bg-acento text-acento-tinta"
                  : "border-contorno bg-fundo text-tinta-2"
              }`}
            >
              {year}
            </Link>
          ))}
        </div>
      )}

      {matches.length === 0 ? (
        <Bloco enfase="destaque" className="mt-5">
          <TituloBloco>Nenhum jogo registrado em {season}</TituloBloco>
          <p className="mt-2 text-[14px] leading-relaxed text-tinta-2">
            Registre os jogos com os minutos em campo. Em uma temporada, esse
            histórico vira a fotografia mais honesta do momento do seu atleta —
            e é o tipo de registro que quase ninguém tem guardado.
          </p>
        </Bloco>
      ) : (
        <>
          <SeasonStatsCard
            stats={stats}
            matches={cronologico}
            season={season}
          />

          <section className="mt-6">
            <div className="mb-3 flex items-baseline justify-between">
              <TituloBloco>Últimos jogos</TituloBloco>
              <Rotulo>{matches.length}</Rotulo>
            </div>
            <ul className="space-y-2.5">
              {matches.map((match) => (
                <MatchRow key={match.id} match={match} />
              ))}
            </ul>
          </section>
        </>
      )}

      <NewMatchForm athleteId={athlete.id} />
    </>
  );
}
