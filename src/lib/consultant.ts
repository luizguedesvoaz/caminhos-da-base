/**
 * Tipos e regras do painel do consultor.
 *
 * Este arquivo é seguro para o navegador: nada aqui importa código de
 * servidor. O portão de acesso vive em `consultant-guard.ts`.
 */

export type AthleteOverview = {
  athlete_id: string;
  athlete_name: string;
  birth_year: number;
  category: number | null;
  category_year: string | null;
  club_name: string | null;
  athlete_position: string | null;   // `position` e palavra reservada no PostgreSQL
  step: number | null;
  step_reason: string | null;
  guardian_name: string | null;
  guardian_id: string | null;
  guardian_blocked: boolean;
  tasks_open: number;
  tasks_done: number;
  actions_30d: number;
  last_activity: string;
  minutes_season: number;
  matches_season: number;
  goals_season: number;
  assists_season: number;
  invested_cents: number;
  docs_expired: number;
  coins: number;
  scouting_visible: boolean;
  created_at: string;
};

export type ConsultantStats = {
  athletes?: number;
  families?: number;
  blocked?: number;
  step1?: number;
  step2?: number;
  step3?: number;
  pending_entries?: number;
  invested_cents?: number;
  docs_expired?: number;
};

export type EntryQueueItem = {
  kind: "publica" | "indicacao";
  id: string;
  name: string;
  phone: string;
  email: string | null;
  athlete_name: string | null;
  detail: string | null;
  referrer_name: string | null;
  status: string;
  invite_code: string | null;
  created_at: string;
};

/** Dias desde a última ação registrada pela família. */
export function daysSince(iso: string, now: Date = new Date()): number {
  const then = new Date(iso);
  return Math.floor((now.getTime() - then.getTime()) / 86_400_000);
}

/**
 * Classificação de risco de abandono — a informação mais acionável do painel.
 *
 * Não é previsão de talento: é sinal de que a família está deixando o app (e,
 * na prática, deixando o acompanhamento). É o que permite ligar antes de perder.
 */
export type Engagement = "ativo" | "esfriando" | "sumido" | "novo";

export function engagementOf(
  athlete: Pick<AthleteOverview, "actions_30d" | "last_activity" | "created_at">,
  now: Date = new Date(),
): Engagement {
  const idle = daysSince(athlete.last_activity, now);
  const age = daysSince(athlete.created_at, now);

  if (age <= 7 && athlete.actions_30d === 0) return "novo";
  if (idle >= 30) return "sumido";
  if (idle >= 14 || athlete.actions_30d <= 2) return "esfriando";
  return "ativo";
}

export const ENGAGEMENT_STYLE: Record<
  Engagement,
  { label: string; className: string }
> = {
  ativo: { label: "Ativo", className: "bg-emerald-50 text-emerald-800" },
  esfriando: { label: "Esfriando", className: "bg-amber-50 text-amber-900" },
  sumido: { label: "Sumido", className: "bg-red-50 text-red-800" },
  novo: { label: "Recém-cadastrado", className: "bg-fundo-2 text-tinta" },
};

export type SortKey =
  | "atividade"
  | "sumidos"
  | "degrau"
  | "minutagem"
  | "gols"
  | "assistencias"
  | "participacoes"
  | "investido"
  | "nome"
  | "recentes";

export const SORT_LABELS: Record<SortKey, string> = {
  atividade: "Mais ativos",
  sumidos: "Sumidos primeiro",
  degrau: "Degrau mais alto",
  minutagem: "Mais minutos em campo",
  gols: "Mais gols",
  assistencias: "Mais assistências",
  participacoes: "Gols + assistências",
  investido: "Maior investimento",
  recentes: "Cadastro mais recente",
  nome: "Nome",
};

export function sortAthletes(
  list: AthleteOverview[],
  key: SortKey,
): AthleteOverview[] {
  const copy = [...list];
  switch (key) {
    case "atividade":
      return copy.sort((a, b) => b.actions_30d - a.actions_30d);
    case "sumidos":
      return copy.sort(
        (a, b) => daysSince(b.last_activity) - daysSince(a.last_activity),
      );
    case "degrau":
      return copy.sort(
        (a, b) => (b.step ?? 0) - (a.step ?? 0) || b.actions_30d - a.actions_30d,
      );
    case "minutagem":
      return copy.sort((a, b) => b.minutes_season - a.minutes_season);
    case "gols":
      return copy.sort((a, b) => b.goals_season - a.goals_season);
    case "assistencias":
      return copy.sort((a, b) => b.assists_season - a.assists_season);
    case "participacoes":
      return copy.sort(
        (a, b) =>
          b.goals_season + b.assists_season - (a.goals_season + a.assists_season),
      );
    case "investido":
      return copy.sort((a, b) => Number(b.invested_cents) - Number(a.invested_cents));
    case "recentes":
      return copy.sort((a, b) => b.created_at.localeCompare(a.created_at));
    case "nome":
      return copy.sort((a, b) => a.athlete_name.localeCompare(b.athlete_name, "pt-BR"));
  }
}

/**
 * Posições usadas no cadastro. Mantidas em sincronia com a lista do
 * onboarding — se uma mudar, a outra precisa mudar junto.
 */
export const POSITIONS = [
  "Goleiro",
  "Lateral",
  "Zagueiro",
  "Volante",
  "Meia",
  "Ponta",
  "Atacante",
] as const;

export const CATEGORY_OPTIONS = [7, 9, 11, 13, 15, 17, 20] as const;

export type Filters = {
  query: string;
  positions: string[];
  categories: number[];
  steps: number[];
  onlyVisible: boolean;
  onlyWithStats: boolean;
};

export const EMPTY_FILTERS: Filters = {
  query: "",
  positions: [],
  categories: [],
  steps: [],
  onlyVisible: false,
  onlyWithStats: false,
};

/** Remove acento e caixa para a busca casar "Gonçalves" com "goncalves". */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Filtro executado no navegador, de propósito.
 *
 * Com algumas centenas de atletas, filtrar na memória responde a cada tecla
 * digitada sem nenhuma ida ao servidor — é mais rápido do que qualquer
 * consulta, por melhor indexada que esteja. Se a base passar de alguns
 * milhares, aí sim vale mover para o banco com índice de texto.
 */
export function filterAthletes(
  list: AthleteOverview[],
  filters: Filters,
): AthleteOverview[] {
  const terms = normalize(filters.query).split(/\s+/).filter(Boolean);

  return list.filter((athlete) => {
    if (filters.onlyVisible && !athlete.scouting_visible) return false;

    if (
      filters.onlyWithStats &&
      athlete.matches_season === 0
    ) {
      return false;
    }

    if (
      filters.positions.length > 0 &&
      !filters.positions.includes(athlete.athlete_position ?? "")
    ) {
      return false;
    }

    if (
      filters.categories.length > 0 &&
      !filters.categories.includes(athlete.category ?? -1)
    ) {
      return false;
    }

    if (filters.steps.length > 0 && !filters.steps.includes(athlete.step ?? 0)) {
      return false;
    }

    if (terms.length === 0) return true;

    // Cada palavra digitada precisa aparecer em algum campo — assim
    // "meia corinthians" encontra o meia do Corinthians.
    const haystack = normalize(
      [
        athlete.athlete_name,
        athlete.club_name,
        athlete.athlete_position,
        athlete.guardian_name,
        athlete.birth_year,
        athlete.category ? `sub-${athlete.category}` : "",
      ]
        .filter(Boolean)
        .join(" "),
    );

    return terms.every((term) => haystack.includes(term));
  });
}

/** Resumo dos números de quem está na seleção atual. */
export function summarizeSelection(list: AthleteOverview[]) {
  return {
    count: list.length,
    goals: list.reduce((sum, a) => sum + a.goals_season, 0),
    assists: list.reduce((sum, a) => sum + a.assists_season, 0),
    minutes: list.reduce((sum, a) => sum + a.minutes_season, 0),
    hidden: list.filter((a) => !a.scouting_visible).length,
  };
}
