import { Card } from "@/components/ui";
import { formatMinutes, readSeason, type SeasonStats } from "@/lib/domain/season";

/**
 * Minutagem é o número-herói da temporada; gols e assistências ficam em
 * segundo plano, de propósito. Ver src/lib/domain/season.ts.
 */
export function SeasonStatsCard({
  stats,
  season,
}: {
  stats: SeasonStats;
  season: number;
}) {
  const reading = readSeason(stats);

  return (
    <>
      <Card className="bg-navy-900 text-white">
        <p className="text-sm text-white/70">Minutos em campo em {season}</p>
        <p className="mt-1 text-[2.75rem] font-bold leading-none tabular-nums">
          {formatMinutes(stats.minutes)}
        </p>
        <p className="mt-2 text-sm text-white/70">
          {stats.matches} {stats.matches === 1 ? "jogo" : "jogos"} · média de{" "}
          {stats.averageMinutes} min
        </p>
        <p className="mt-4 border-t border-white/15 pt-3 text-xs leading-relaxed text-white/60">
          Minuto em campo é o que olheiro de base observa primeiro — mais do que
          gol.
        </p>
      </Card>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { label: "Gols", value: stats.goals },
          { label: "Assistências", value: stats.assists },
          { label: "Jogos inteiros", value: stats.fullMatches },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-line bg-white p-4 text-center"
          >
            <p className="text-2xl font-bold tabular-nums text-navy-900">
              {item.value}
            </p>
            <p className="mt-0.5 text-xs leading-tight text-muted">{item.label}</p>
          </div>
        ))}
      </div>

      {reading && (
        <Card className="mt-4">
          <h2 className="font-semibold text-navy-900">Como foi a temporada</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{reading}</p>
        </Card>
      )}
    </>
  );
}
