import { Bloco, Rotulo } from "@/components/ui";
import { BarrasJogos } from "@/components/BarrasJogos";
import {
  formatMinutes,
  readSeason,
  type Match,
  type SeasonStats,
} from "@/lib/domain/season";

/**
 * O resumo da temporada.
 *
 * Minutagem é o número-herói, acima de gols — decisão de produto registrada em
 * src/lib/domain/season.ts. O desenho reforça isso pelo tamanho: 92px para os
 * minutos, 26px para todo o resto.
 */
export function SeasonStatsCard({
  stats,
  matches,
  season,
}: {
  stats: SeasonStats;
  /** Em ordem cronológica — o gráfico lê da esquerda (jan) para a direita. */
  matches: Match[];
  season: number;
}) {
  const reading = readSeason(stats);

  const mes = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { month: "short" });
  const periodo =
    matches.length > 1
      ? `${mes(matches[0].played_on)}/${mes(matches[matches.length - 1].played_on)}`
      : matches.length === 1
        ? mes(matches[0].played_on)
        : "";

  return (
    <>
      <Bloco enfase="destaque" className="mt-5">
        <Rotulo>Minutos em campo · {season}</Rotulo>
        <div className="mt-2 flex items-end justify-between gap-4">
          <p className="font-display text-[92px] font-extrabold leading-[.84] tracking-[-.05em] tabular text-tinta">
            {stats.minutes}
          </p>
          <p className="pb-2 text-right font-display text-[26px] font-extrabold leading-none tracking-[-.03em] tabular text-tinta-2">
            {formatMinutes(stats.minutes)}
          </p>
        </div>
        <p className="mt-3 border-t-2 border-contorno pt-3 text-[13px] leading-relaxed text-tinta-2">
          Minuto em campo é o que olheiro de base observa primeiro — mais do que
          gol.
        </p>
      </Bloco>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {[
          { label: "Jogos", value: stats.matches, cor: "text-tinta" },
          { label: "Min/jogo", value: stats.averageMinutes, cor: "text-tinta" },
          { label: "Gols", value: stats.goals, cor: "text-acento-texto" },
          { label: "Assistências", value: stats.assists, cor: "text-tinta" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-[var(--radius-card)] border-2 border-contorno p-4"
          >
            <p
              className={`font-display text-[34px] font-extrabold leading-none tracking-[-.04em] tabular ${item.cor}`}
            >
              {item.value}
            </p>
            <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-tinta-2">
              {item.label}
            </p>
          </div>
        ))}
      </div>

      {matches.length > 0 && (
        <Bloco className="mt-3">
          <Rotulo>Jogo a jogo</Rotulo>
          <div className="mt-3">
            <BarrasJogos
              jogos={matches.map((m) => ({
                minutos: m.minutes_played ?? 0,
                rotulo: `${m.opponent ?? "Jogo"} — ${m.minutes_played ?? 0} min`,
              }))}
              altura={94}
              gap={3}
            />
          </div>
          <div className="mt-2 flex items-baseline justify-between text-[11px] font-bold uppercase tracking-[.14em] text-tinta-2">
            <span>{periodo}</span>
            <span>{matches.length} jogos</span>
          </div>
          {stats.benchedMatches > 0 && (
            <p className="mt-2 text-[13px] leading-relaxed text-tinta-2">
              As barras vermelhas são os jogos em que ficou no banco sem entrar
              — {stats.benchedMatches}{" "}
              {stats.benchedMatches === 1 ? "vez" : "vezes"} nesta temporada.
            </p>
          )}
        </Bloco>
      )}

      {reading && (
        <Bloco className="mt-3">
          <Rotulo>Como foi a temporada</Rotulo>
          <p className="mt-2 text-[14px] leading-relaxed text-tinta">{reading}</p>
        </Bloco>
      )}
    </>
  );
}
