import Link from "next/link";
import { ChevronRight, EyeOff, FileWarning, PauseCircle } from "lucide-react";
import { formatCents } from "@/lib/domain/expenses";
import { formatMinutes } from "@/lib/domain/season";
import { categoryLabel } from "@/lib/domain/category";
import {
  daysSince,
  engagementOf,
  ENGAGEMENT_STYLE,
  type AthleteOverview,
} from "@/lib/consultant";

/**
 * Lista de atletas do painel.
 *
 * Cada linha responde três perguntas de trabalho: em que degrau está, se a
 * família está usando o app, e quanto já investiu. Sem pontuação secreta —
 * todo número mostrado é um fato contável, para que a decisão seja sua.
 */
export function AthleteTable({ athletes }: { athletes: AthleteOverview[] }) {
  if (athletes.length === 0) {
    return (
      <p className="rounded-xl border border-line bg-white p-5 text-sm text-muted">
        Nenhum atleta nesta seleção.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {athletes.map((athlete) => {
        const state = engagementOf(athlete);
        const style = ENGAGEMENT_STYLE[state];
        const idle = daysSince(athlete.last_activity);

        return (
          <li key={athlete.athlete_id}>
            <Link
              href={`/painel/atleta/${athlete.athlete_id}`}
              prefetch={false}
              className="block rounded-xl border border-line bg-white p-4 transition-colors hover:border-navy-300"
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">
                      {athlete.athlete_name}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${style.className}`}
                    >
                      {style.label}
                    </span>
                    {athlete.guardian_blocked && (
                      <span className="flex items-center gap-1 rounded-full bg-navy-900/10 px-2 py-0.5 text-xs font-medium text-navy-900">
                        <PauseCircle size={11} aria-hidden />
                        Pausada
                      </span>
                    )}
                    {!athlete.scouting_visible && (
                      <span className="flex items-center gap-1 rounded-full bg-navy-900/8 px-2 py-0.5 text-xs font-medium text-muted">
                        <EyeOff size={11} aria-hidden />
                        Fora da vitrine
                      </span>
                    )}
                    {athlete.docs_expired > 0 && (
                      <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-800">
                        <FileWarning size={11} aria-hidden />
                        {athlete.docs_expired} vencido
                        {athlete.docs_expired > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-muted">
                    Degrau {athlete.step ?? 1} ·{" "}
                    {categoryLabel(athlete.category as never)}
                    {athlete.category_year &&
                      ` · ${athlete.category_year === "primeiro" ? "1º" : "2º"} ano`}
                    {athlete.club_name && ` · ${athlete.club_name}`}
                  </p>

                  <p className="mt-0.5 text-xs text-muted">
                    Responsável: {athlete.guardian_name ?? "não vinculado"}
                  </p>

                  <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    <span>
                      <strong className="tabular-nums text-ink">
                        {athlete.actions_30d}
                      </strong>{" "}
                      ações em 30 dias
                    </span>
                    <span>
                      último uso{" "}
                      <strong className="tabular-nums text-ink">
                        {idle === 0 ? "hoje" : `há ${idle}d`}
                      </strong>
                    </span>
                    <span>
                      <strong className="tabular-nums text-ink">
                        {formatMinutes(athlete.minutes_season)}
                      </strong>{" "}
                      em campo
                    </span>
                    <span>
                      <strong className="tabular-nums text-ink">
                        {athlete.goals_season}
                      </strong>{" "}
                      {athlete.goals_season === 1 ? "gol" : "gols"}
                    </span>
                    <span>
                      <strong className="tabular-nums text-ink">
                        {athlete.assists_season}
                      </strong>{" "}
                      {athlete.assists_season === 1 ? "assist." : "assist."}
                    </span>
                    <span>
                      <strong className="tabular-nums text-ink">
                        {formatCents(Number(athlete.invested_cents))}
                      </strong>{" "}
                      investido
                    </span>
                  </div>
                </div>

                <ChevronRight
                  size={18}
                  className="mt-1 shrink-0 text-muted"
                  aria-hidden
                />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
