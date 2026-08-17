import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StepAdjuster } from "@/components/painel/StepAdjuster";
import { AccountToggle } from "@/components/painel/AccountToggle";
import { formatCents } from "@/lib/domain/expenses";
import { formatMinutes } from "@/lib/domain/season";
import { categoryLabel } from "@/lib/domain/category";
import { STEPS, type Step } from "@/lib/domain/pyramid";
import {
  daysSince,
  engagementOf,
  ENGAGEMENT_STYLE,
  type AthleteOverview,
} from "@/lib/consultant";

export default async function AtletaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: overview } = await supabase.rpc("consultant_athlete_overview");
  const athlete = ((overview ?? []) as AthleteOverview[]).find(
    (a) => a.athlete_id === id,
  );
  if (!athlete) notFound();

  // Histórico de degraus: mostra a evolução e registra ajustes manuais.
  const { data: history } = await supabase
    .from("pyramid_evaluations")
    .select("id, step, reason, source, note, evaluated_at")
    .eq("athlete_id", id)
    .order("evaluated_at", { ascending: false })
    .limit(20);

  const state = engagementOf(athlete);
  const style = ENGAGEMENT_STYLE[state];
  const idle = daysSince(athlete.last_activity);
  const step = (athlete.step ?? 1) as Step;

  return (
    <>
      <Link
        href="/painel"
        prefetch={false}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted"
      >
        <ArrowLeft size={16} aria-hidden />
        Voltar ao painel
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">
            {athlete.athlete_name}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {categoryLabel(athlete.category as never)}
            {athlete.category_year &&
              ` · ${athlete.category_year === "primeiro" ? "1º" : "2º"} ano`}
            {athlete.athlete_position && ` · ${athlete.athlete_position}`}
            {athlete.club_name && ` · ${athlete.club_name}`}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${style.className}`}
        >
          {style.label}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Degrau", value: `${step} — ${STEPS[step].name}` },
          {
            label: "Minutos na temporada",
            value: formatMinutes(athlete.minutes_season),
            hint: `${athlete.matches_season} ${athlete.matches_season === 1 ? "jogo" : "jogos"}`,
          },
          {
            label: "Investido pela família",
            value: formatCents(Number(athlete.invested_cents)),
          },
          {
            label: "Atividade",
            value: `${athlete.actions_30d} em 30 dias`,
            hint: idle === 0 ? "usou hoje" : `último uso há ${idle} dias`,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-line bg-white p-4"
          >
            <p className="text-xs text-muted">{card.label}</p>
            <p className="mt-1 font-bold tabular-nums text-navy-900">
              {card.value}
            </p>
            {card.hint && <p className="mt-0.5 text-xs text-muted">{card.hint}</p>}
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-5">
          <h3 className="text-sm font-semibold text-navy-900">Família</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Responsável</dt>
              <dd className="text-right text-ink">
                {athlete.guardian_name ?? "não vinculado"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Tarefas concluídas</dt>
              <dd className="text-right tabular-nums text-ink">
                {athlete.tasks_done}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Tarefas abertas</dt>
              <dd className="text-right tabular-nums text-ink">
                {athlete.tasks_open}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Documentos vencidos</dt>
              <dd
                className={`text-right tabular-nums ${
                  athlete.docs_expired > 0 ? "font-semibold text-red-700" : "text-ink"
                }`}
              >
                {athlete.docs_expired}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Moedas</dt>
              <dd className="text-right tabular-nums text-ink">{athlete.coins}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Cadastrado em</dt>
              <dd className="text-right text-ink">
                {new Date(athlete.created_at).toLocaleDateString("pt-BR")}
              </dd>
            </div>
          </dl>

          {athlete.guardian_id && (
            <div className="mt-4 border-t border-line pt-4">
              <AccountToggle
                userId={athlete.guardian_id}
                blocked={athlete.guardian_blocked}
                name={athlete.guardian_name ?? "esta família"}
              />
            </div>
          )}

          {/* Limite deliberado de privacidade, registrado na migration. */}
          <p className="mt-4 text-xs leading-relaxed text-muted">
            O painel mostra o total investido, não os lançamentos individuais.
            Decisão de projeto: o suficiente para trabalhar, sem virar
            vigilância da vida da família.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5">
          <h3 className="text-sm font-semibold text-navy-900">
            Degrau da pirâmide
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {athlete.step_reason ?? "Ainda não avaliado."}
          </p>

          <div className="mt-4 border-t border-line pt-4">
            <StepAdjuster athleteId={athlete.athlete_id} currentStep={step} />
          </div>
        </div>
      </div>

      {history && history.length > 0 && (
        <section className="mt-4 rounded-2xl border border-line bg-white p-5">
          <h3 className="text-sm font-semibold text-navy-900">
            Histórico de avaliações
          </h3>
          <ul className="mt-3 space-y-3">
            {history.map((entry) => (
              <li key={entry.id} className="border-l-2 border-line pl-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-ink">
                    Degrau {entry.step}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      entry.source === "manual"
                        ? "bg-gold-500/15 text-gold-600"
                        : "bg-navy-50 text-navy-900"
                    }`}
                  >
                    {entry.source === "manual" ? "ajuste manual" : "automático"}
                  </span>
                  <span className="text-xs text-muted">
                    {new Date(entry.evaluated_at).toLocaleString("pt-BR")}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-muted">{entry.reason}</p>
                {entry.note && (
                  <p className="mt-0.5 text-sm italic text-ink">“{entry.note}”</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
