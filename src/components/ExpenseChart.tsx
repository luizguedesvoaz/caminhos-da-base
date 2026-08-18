import { EXPENSE_CATEGORIES, formatCents, type ExpenseCategory } from "@/lib/domain/expenses";

/**
 * Gastos por categoria — barras horizontais.
 *
 * Decisões de visualização, seguindo as regras do projeto:
 *
 * · FORMA: o trabalho do leitor é comparar magnitude entre categorias de nomes
 *   longos. Barra horizontal é a forma indicada; pizza esconderia diferenças.
 *
 * · COR: uma única matiz. As categorias são nominais e a identidade já vem do
 *   rótulo ao lado — colorir cada barra de um jeito gastaria o canal de cor
 *   recodificando o que o comprimento já mostra.
 *
 * · RÓTULOS: valor visível em toda barra, em tinta de texto e não na cor da
 *   série. Como celular não tem hover, rótulo direto é a única leitura possível.
 *
 * · Extremidade arredondada de 4px ancorada na linha de base, trilha recessiva.
 */
export function ExpenseChart({
  data,
  total,
}: {
  data: { category: ExpenseCategory; cents: number }[];
  total: number;
}) {
  const rows = data.filter((d) => d.cents > 0).sort((a, b) => b.cents - a.cents);
  if (rows.length === 0) return null;

  const max = rows[0].cents;

  return (
    <figure className="m-0">
      <figcaption className="mb-3 text-sm font-semibold text-tinta">
        Onde o dinheiro foi
      </figcaption>

      <ul className="space-y-3">
        {rows.map(({ category, cents }) => {
          const share = Math.round((cents / total) * 100);
          return (
            <li key={category}>
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className="text-sm text-tinta">
                  {EXPENSE_CATEGORIES[category].label}
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-tinta">
                  {formatCents(cents)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Trilha recessiva; barra em matiz única, ponta arredondada */}
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-tinta/10">
                  <div
                    className="h-full rounded-full bg-acento"
                    style={{ width: `${Math.max((cents / max) * 100, 3)}%` }}
                  />
                </div>
                <span className="w-9 shrink-0 text-right text-xs tabular-nums text-tinta-2">
                  {share}%
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

/** Evolução por mês na temporada. Mesma matiz, mesma lógica de leitura. */
export function MonthlyChart({
  months,
}: {
  months: { label: string; cents: number }[];
}) {
  const max = Math.max(...months.map((m) => m.cents), 1);
  const hasData = months.some((m) => m.cents > 0);
  if (!hasData) return null;

  return (
    <figure className="m-0">
      <figcaption className="mb-3 text-sm font-semibold text-tinta">
        Gasto por mês
      </figcaption>
      {/* As barras são filhas DIRETAS de um container com altura definida (h-28).
          Se ficassem dentro de uma coluna de altura automática, a altura em
          porcentagem não teria contra o que ser calculada e o gráfico
          renderizaria vazio — bug pego na revisão visual da onda 2. */}
      <div className="flex h-28 items-end gap-1.5">
        {months.map((m) => (
          <div
            key={m.label}
            title={`${m.label}: ${formatCents(m.cents)}`}
            className="flex-1 rounded-t"
            style={{
              height: `${Math.max((m.cents / max) * 100, m.cents > 0 ? 4 : 1.5)}%`,
              backgroundColor: m.cents > 0 ? "#2a3572" : "#e5e7eb",
            }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {months.map((m) => (
          <span
            key={m.label}
            className="flex-1 text-center text-[10px] text-tinta-2"
          >
            {m.label}
          </span>
        ))}
      </div>
    </figure>
  );
}
