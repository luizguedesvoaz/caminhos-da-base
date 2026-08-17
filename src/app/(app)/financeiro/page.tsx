import { createClient } from "@/lib/supabase/server";
import { getActiveAthlete } from "@/lib/athlete";
import { AthleteHeader } from "@/components/AthleteHeader";
import { NewExpenseForm } from "@/components/NewExpenseForm";
import { ExpenseChart, MonthlyChart } from "@/components/ExpenseChart";
import { ExpenseRow } from "@/components/ExpenseRow";
import { Card } from "@/components/ui";
import {
  EXPENSE_CATEGORIES,
  MONTH_NAMES,
  formatCents,
  type ExpenseCategory,
} from "@/lib/domain/expenses";
import { currentSeason } from "@/lib/domain/category";

export default async function FinanceiroPage() {
  const { athlete, all } = await getActiveAthlete();
  const supabase = await createClient();
  const season = currentSeason();

  const { data: expenses } = await supabase
    .from("expenses")
    .select("id, amount_cents, category, spent_on, note, season_year")
    .eq("athlete_id", athlete.id)
    .is("deleted_at", null)
    .order("spent_on", { ascending: false })
    .limit(500);

  const list = expenses ?? [];

  // Somas em centavos inteiros — sem ponto flutuante em nenhuma etapa.
  const totalAllTime = list.reduce((sum, e) => sum + e.amount_cents, 0);
  const seasonList = list.filter((e) => e.season_year === season);
  const totalSeason = seasonList.reduce((sum, e) => sum + e.amount_cents, 0);

  const byCategory = new Map<ExpenseCategory, number>();
  for (const e of list) {
    const key = e.category as ExpenseCategory;
    byCategory.set(key, (byCategory.get(key) ?? 0) + e.amount_cents);
  }

  const monthly = MONTH_NAMES.map((label, index) => ({
    label,
    cents: seasonList
      .filter((e) => Number(e.spent_on.slice(5, 7)) === index + 1)
      .reduce((sum, e) => sum + e.amount_cents, 0),
  }));

  return (
    <>
      <AthleteHeader
        athlete={athlete}
        all={all}
        subtitle="O ativo em construção"
      />

      {/* Número-herói: o dado mais compartilhável do produto. */}
      <Card className="bg-navy-900 text-white">
        <p className="text-sm text-white/70">Total investido até aqui</p>
        <p className="mt-1 text-[2.75rem] font-bold leading-none tabular-nums">
          {formatCents(totalAllTime)}
        </p>
        {totalSeason !== totalAllTime && (
          <p className="mt-3 text-sm text-white/70">
            {formatCents(totalSeason)} na temporada {season}
          </p>
        )}
        <p className="mt-4 border-t border-white/15 pt-3 text-xs leading-relaxed text-white/60">
          Todo esse investimento merece um plano de carreira à altura.
        </p>
      </Card>

      {list.length === 0 ? (
        <Card className="mt-4">
          <h2 className="font-semibold text-navy-900">
            Ainda não há nenhum gasto registrado
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Comece pela mensalidade do mês. Em poucas semanas você vai enxergar
            o tamanho real do investimento — e é um número que quase nenhum pai
            sabe de cabeça.
          </p>
        </Card>
      ) : (
        <>
          <Card className="mt-4">
            <ExpenseChart
              data={[...byCategory.entries()].map(([category, cents]) => ({
                category,
                cents,
              }))}
              total={totalAllTime}
            />
          </Card>

          <Card className="mt-4">
            <MonthlyChart months={monthly} />
          </Card>

          <section className="mt-6">
            <h2 className="mb-2 text-sm font-semibold text-navy-900">
              Lançamentos
            </h2>
            <ul className="space-y-2">
              {list.slice(0, 50).map((e) => (
                <ExpenseRow
                  key={e.id}
                  id={e.id}
                  amountCents={e.amount_cents}
                  categoryLabel={
                    EXPENSE_CATEGORIES[e.category as ExpenseCategory].label
                  }
                  spentOn={e.spent_on}
                  note={e.note}
                />
              ))}
            </ul>
          </section>
        </>
      )}

      <NewExpenseForm athleteId={athlete.id} />
    </>
  );
}
