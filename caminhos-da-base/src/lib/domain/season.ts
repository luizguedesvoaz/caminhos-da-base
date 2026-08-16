/**
 * Estatísticas da temporada.
 *
 * DECISÃO DE PRODUTO: minutagem é a métrica-título, acima de gols.
 *
 * Olheiro de base avalia minutos em campo e constância; pai olha gol. Ao pôr
 * os minutos como número principal, o app educa o usuário sobre o que
 * realmente pesa na formação — e isso é conteúdo da consultoria embutido no
 * produto, não só uma escolha de layout.
 */

export type Match = {
  id: string;
  played_on: string;
  opponent: string | null;
  competition_name: string | null;
  minutes_played: number | null;
  goals: number;
  assists: number;
  video_url: string | null;
  notes: string | null;
};

export type SeasonStats = {
  matches: number;
  minutes: number;
  goals: number;
  assists: number;
  averageMinutes: number;
  fullMatches: number;
  benchedMatches: number;
  participations: number;
};

/** Um jogo completo no futebol de base é considerado a partir de 80 minutos. */
const FULL_MATCH_MINUTES = 80;

export function summarize(matches: Match[]): SeasonStats {
  const played = matches.length;
  const minutes = matches.reduce((sum, m) => sum + (m.minutes_played ?? 0), 0);
  const goals = matches.reduce((sum, m) => sum + m.goals, 0);
  const assists = matches.reduce((sum, m) => sum + m.assists, 0);

  return {
    matches: played,
    minutes,
    goals,
    assists,
    averageMinutes: played > 0 ? Math.round(minutes / played) : 0,
    fullMatches: matches.filter((m) => (m.minutes_played ?? 0) >= FULL_MATCH_MINUTES)
      .length,
    benchedMatches: matches.filter((m) => (m.minutes_played ?? 0) === 0).length,
    participations: goals + assists,
  };
}

/**
 * Leitura da temporada em linguagem de pai, sem jargão e sem julgamento.
 * O texto descreve o que aconteceu; não recomenda nem avalia o atleta.
 */
export function readSeason(stats: SeasonStats): string | null {
  if (stats.matches === 0) return null;

  const parts: string[] = [];
  parts.push(
    `Em ${stats.matches} ${stats.matches === 1 ? "jogo" : "jogos"} registrados, foram ${stats.minutes} minutos em campo — média de ${stats.averageMinutes} por jogo.`,
  );

  if (stats.fullMatches > 0) {
    parts.push(
      `Jogou a partida inteira ${stats.fullMatches} ${stats.fullMatches === 1 ? "vez" : "vezes"}.`,
    );
  }
  if (stats.benchedMatches > 0) {
    parts.push(
      `Ficou no banco sem entrar em ${stats.benchedMatches} ${stats.benchedMatches === 1 ? "jogo" : "jogos"}.`,
    );
  }

  return parts.join(" ");
}

/** Aceita youtube.com/watch, youtu.be e Shorts. Devolve null se não for YouTube. */
export function youtubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?(?:.*&)?v=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function formatMinutes(total: number): string {
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h${String(minutes).padStart(2, "0")}`;
}
