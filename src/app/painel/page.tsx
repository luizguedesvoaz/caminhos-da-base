import Link from "next/link";
import { AlertTriangle, Users, TrendingUp, FileWarning } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AthleteExplorer } from "@/components/painel/AthleteExplorer";
import { formatCents } from "@/lib/domain/expenses";
import {
  engagementOf,
  type AthleteOverview,
  type ConsultantStats,
} from "@/lib/consultant";

export default async function PainelPage({
  searchParams,
}: {
  searchParams: Promise<{ ordem?: string; filtro?: string }>;
}) {
  const { ordem, filtro } = await searchParams;
  const supabase = await createClient();

  const [{ data: stats }, { data: overview }] = await Promise.all([
    supabase.rpc("consultant_stats"),
    supabase.rpc("consultant_athlete_overview"),
  ]);

  const s = (stats ?? {}) as ConsultantStats;
  let athletes = (overview ?? []) as AthleteOverview[];

  if (filtro === "sumidos") {
    athletes = athletes.filter(
      (a) => engagementOf(a) === "sumido" || engagementOf(a) === "esfriando",
    );
  } else if (filtro === "documentos") {
    athletes = athletes.filter((a) => a.docs_expired > 0);
  } else if (filtro === "pausados") {
    athletes = athletes.filter((a) => a.guardian_blocked);
  }

  const all = (overview ?? []) as AthleteOverview[];
  const slipping = all.filter((a) => {
    const state = engagementOf(a);
    return state === "sumido" || state === "esfriando";
  }).length;

  return (
    <>
      {/* Números do topo. Entradas pendentes vem primeiro porque é a única
          linha que exige ação hoje. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/painel/entradas"
          prefetch={false}
          className={`rounded-2xl border p-5 ${
            (s.pending_entries ?? 0) > 0
              ? "border-jogo bg-jogo/10"
              : "border-contorno bg-fundo"
          }`}
        >
          <p className="text-sm text-tinta-2">Entradas aguardando</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-tinta">
            {s.pending_entries ?? 0}
          </p>
          {(s.pending_entries ?? 0) > 0 && (
            <p className="mt-1 text-xs font-medium text-jogo-tinta-2">
              Tratar agora
            </p>
          )}
        </Link>

        <div className="rounded-2xl border border-contorno bg-fundo p-5">
          <p className="flex items-center gap-1.5 text-sm text-tinta-2">
            <Users size={14} aria-hidden />
            Atletas
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-tinta">
            {s.athletes ?? 0}
          </p>
          <p className="mt-1 text-xs text-tinta-2">
            {s.families ?? 0} {s.families === 1 ? "família" : "famílias"}
            {(s.blocked ?? 0) > 0 && ` · ${s.blocked} pausada(s)`}
          </p>
        </div>

        <Link
          href="/painel?filtro=sumidos&ordem=sumidos"
          prefetch={false}
          className={`rounded-2xl border p-5 ${
            slipping > 0 ? "border-amber-300 bg-amber-50" : "border-contorno bg-fundo"
          }`}
        >
          <p className="flex items-center gap-1.5 text-sm text-tinta-2">
            <AlertTriangle size={14} aria-hidden />
            Escapando
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-tinta">
            {slipping}
          </p>
          <p className="mt-1 text-xs text-tinta-2">Sem uso há 14 dias ou mais</p>
        </Link>

        <div className="rounded-2xl border border-contorno bg-fundo p-5">
          <p className="flex items-center gap-1.5 text-sm text-tinta-2">
            <TrendingUp size={14} aria-hidden />
            Investido pelas famílias
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-tinta">
            {formatCents(Number(s.invested_cents ?? 0))}
          </p>
          <p className="mt-1 text-xs text-tinta-2">Soma de todos os atletas</p>
        </div>
      </div>

      {/* Distribuição na pirâmide: a fotografia da sua base de clientes. */}
      <div className="mt-4 rounded-2xl border border-contorno bg-fundo p-5">
        <h2 className="text-sm font-semibold text-tinta">
          Distribuição na pirâmide
        </h2>
        <div className="mt-3 space-y-2.5">
          {[
            { label: "Degrau 3 — Alto Rendimento", value: s.step3 ?? 0 },
            { label: "Degrau 2 — Competições", value: s.step2 ?? 0 },
            { label: "Degrau 1 — Iniciação", value: s.step1 ?? 0 },
          ].map((row) => {
            const total = (s.step1 ?? 0) + (s.step2 ?? 0) + (s.step3 ?? 0) || 1;
            return (
              <div key={row.label}>
                <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-tinta">{row.label}</span>
                  <span className="font-semibold tabular-nums text-tinta">
                    {row.value}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-tinta/10">
                  <div
                    className="h-full rounded-full bg-acento"
                    style={{ width: `${Math.max((row.value / total) * 100, 1)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {(s.docs_expired ?? 0) > 0 && (
        <Link
          href="/painel?filtro=documentos"
          prefetch={false}
          className="mt-4 flex items-center gap-3 rounded-xl bg-red-50 p-4"
        >
          <FileWarning size={20} className="shrink-0 text-red-700" aria-hidden />
          <p className="flex-1 text-sm text-red-800">
            {s.docs_expired}{" "}
            {s.docs_expired === 1
              ? "documento vencido na base"
              : "documentos vencidos na base"}{" "}
            — motivo comum de atleta ficar fora de jogo
          </p>
        </Link>
      )}

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-tinta">
          Buscar atletas
        </h2>
        <AthleteExplorer athletes={athletes} />
      </section>
    </>
  );
}
