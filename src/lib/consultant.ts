import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Portão do painel.
 *
 * A verificação real de permissão está no banco: toda função do painel checa
 * `is_consultant(auth.uid())` e devolve vazio para quem não é. Isto aqui é só
 * conveniência de navegação — mesmo que alguém force a URL, não há dado para
 * ver.
 */
export async function requireConsultant() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?proximo=/painel");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "consultor") redirect("/inicio");

  return { user, name: profile.full_name as string };
}

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
  invested_cents: number;
  docs_expired: number;
  coins: number;
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
  novo: { label: "Recém-cadastrado", className: "bg-navy-50 text-navy-900" },
};

export type SortKey =
  | "atividade"
  | "sumidos"
  | "degrau"
  | "minutagem"
  | "investido"
  | "nome"
  | "recentes";

export const SORT_LABELS: Record<SortKey, string> = {
  atividade: "Mais ativos",
  sumidos: "Sumidos primeiro",
  degrau: "Degrau mais alto",
  minutagem: "Mais minutos em campo",
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
    case "investido":
      return copy.sort((a, b) => Number(b.invested_cents) - Number(a.invested_cents));
    case "recentes":
      return copy.sort((a, b) => b.created_at.localeCompare(a.created_at));
    case "nome":
      return copy.sort((a, b) => a.athlete_name.localeCompare(b.athlete_name, "pt-BR"));
  }
}
