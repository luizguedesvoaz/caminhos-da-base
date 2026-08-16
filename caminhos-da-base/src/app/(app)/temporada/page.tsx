import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveAthlete } from "@/lib/athlete";
import { AthleteHeader } from "@/components/AthleteHeader";
import { SeasonStatsCard } from "@/components/SeasonStats";
import { MatchRow } from "@/components/MatchRow";
import { NewMatchForm } from "@/components/NewMatchForm";
import { Card } from "@/components/ui";
import { summarize, type Match } from "@/lib/domain/season";
import { categoryFor, categoryLabel, currentSeason } from "@/lib/domain/category";

export default async function TemporadaPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string }>;
}) {
  const { ano } = await searchParams;
  const { athlete, all } = await getActiveAthlete();
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

  const matches = allMatches.filter((m) => m.season_year === season) as Match[];
  const stats = summarize(matches);

  return (
    <>
      <AthleteHeader
        athlete={athlete}
        all={all}
        subtitle={`${categoryLabel(categoryFor(athlete.birth_year, season))} · temporada ${season}`}
      />

      {seasons.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {seasons.map((year) => (
            <Link
              key={year}
              href={`/temporada?ano=${year}`}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
                year === season
                  ? "bg-navy-900 text-white"
                  : "border border-line bg-white text-muted"
              }`}
            >
              {year}
            </Link>
          ))}
        </div>
      )}

      {matches.length === 0 ? (
        <Card>
          <h2 className="font-semibold text-navy-900">
            Nenhum jogo registrado em {season}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Registre os jogos com os minutos em campo. Em uma temporada, esse
            histórico vira a fotografia mais honesta do momento do seu atleta —
            e é o tipo de registro que quase ninguém tem guardado.
          </p>
        </Card>
      ) : (
        <>
          <SeasonStatsCard stats={stats} season={season} />

          <section className="mt-6">
            <h2 className="mb-2 text-sm font-semibold text-navy-900">
              Jogos ({matches.length})
            </h2>
            <ul className="space-y-2">
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
