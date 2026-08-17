import { createClient } from "@/lib/supabase/server";
import { getActiveAthlete } from "@/lib/athlete";
import { AthleteHeader } from "@/components/AthleteHeader";
import { AchievementList } from "@/components/AchievementList";
import { RewardList } from "@/components/RewardList";
import { ReferralCard } from "@/components/ReferralCard";
import { Card } from "@/components/ui";
import {
  computeAchievements,
  formatCoins,
  type CompletedTask,
} from "@/lib/domain/achievements";
import { documentStatus } from "@/lib/domain/documents";
import { currentSeason } from "@/lib/domain/category";

export default async function ConquistasPage() {
  const { athlete, all } = await getActiveAthlete();
  const supabase = await createClient();
  const season = currentSeason();

  const [
    { data: balance },
    { data: completed },
    { count: matchCount },
    { data: documents },
    { count: expenseCount },
    { data: rewards },
    { data: redemptions },
    { data: ledger },
    { data: referrals },
  ] = await Promise.all([
    supabase.rpc("coin_balance"),
    supabase
      .from("tasks")
      .select("category, completed_at")
      .eq("athlete_id", athlete.id)
      .eq("is_done", true)
      .is("deleted_at", null)
      .limit(1000),
    supabase
      .from("matches")
      .select("id", { count: "exact", head: true })
      .eq("athlete_id", athlete.id)
      .eq("season_year", season)
      .is("deleted_at", null),
    supabase
      .from("documents")
      .select("expires_on")
      .eq("athlete_id", athlete.id)
      .is("deleted_at", null),
    supabase
      .from("expenses")
      .select("id", { count: "exact", head: true })
      .eq("athlete_id", athlete.id)
      .is("deleted_at", null),
    supabase
      .from("rewards")
      .select("id, title, description, cost_coins, kind, monthly_limit")
      .eq("is_active", true)
      .order("cost_coins"),
    supabase
      .from("redemptions")
      .select("id, code, status, created_at, reward_id")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("coin_ledger")
      .select("id, amount, description, created_at")
      .order("created_at", { ascending: false })
      .limit(15),
    supabase.from("referrals").select("id, invite_code, referred_id"),
  ]);

  const docs = documents ?? [];
  const achievements = computeAchievements({
    completedTasks: (completed ?? []) as CompletedTask[],
    matchesRegistered: matchCount ?? 0,
    documentsTotal: docs.length,
    documentsExpired: docs.filter(
      (d) => documentStatus(d.expires_on).status === "vencido",
    ).length,
    expensesRegistered: expenseCount ?? 0,
  });

  const unlocked = achievements.filter((a) => a.unlocked).length;
  const coins = Number(balance ?? 0);
  const acceptedReferrals = (referrals ?? []).filter((r) => r.referred_id).length;

  return (
    <>
      <AthleteHeader
        athlete={athlete}
        all={all}
        subtitle="Conquistas e recompensas"
      />

      <Card className="bg-navy-900 text-white">
        <p className="text-sm text-white/70">Suas moedas</p>
        <p className="mt-1 text-[2.75rem] font-bold leading-none tabular-nums">
          {formatCoins(coins)}
        </p>
        <p className="mt-2 text-sm text-white/70">
          {unlocked} de {achievements.length} selos conquistados
        </p>
        {/* Reforça a mensagem: aqui se ganha por rotina, não por resultado. */}
        <p className="mt-4 border-t border-white/15 pt-3 text-xs leading-relaxed text-white/60">
          As moedas vêm da rotina cumprida — treino, escola, saúde e
          documentação em ordem. Não há disputa com outros atletas.
        </p>
      </Card>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-navy-900">Selos</h2>
        <AchievementList achievements={achievements} />
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-navy-900">
          Trocar moedas
        </h2>
        <RewardList rewards={rewards ?? []} balance={coins} />
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-navy-900">Indicar</h2>
        <ReferralCard accepted={acceptedReferrals} />
      </section>

      {redemptions && redemptions.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-semibold text-navy-900">
            Seus resgates
          </h2>
          <ul className="space-y-2">
            {redemptions.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 rounded-xl border border-line bg-white p-3.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-semibold text-navy-900">
                    {r.code}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(r.created_at).toLocaleDateString("pt-BR")} ·{" "}
                    {r.status}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Apresente o código ao consultor ou à loja parceira para usar o
            benefício.
          </p>
        </section>
      )}

      {ledger && ledger.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-semibold text-navy-900">Extrato</h2>
          <ul className="space-y-2">
            {ledger.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center gap-3 rounded-xl border border-line bg-white p-3.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">
                    {entry.description ?? "Movimento"}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(entry.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-sm font-semibold tabular-nums ${
                    entry.amount > 0 ? "text-emerald-700" : "text-muted"
                  }`}
                >
                  {entry.amount > 0 ? "+" : ""}
                  {formatCoins(entry.amount)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
