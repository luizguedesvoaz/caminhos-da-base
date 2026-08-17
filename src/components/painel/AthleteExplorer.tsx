"use client";

import { useMemo, useState } from "react";
import { Search, X, EyeOff } from "lucide-react";
import { AthleteTable } from "@/components/painel/AthleteTable";
import { formatMinutes } from "@/lib/domain/season";
import {
  filterAthletes,
  sortAthletes,
  summarizeSelection,
  CATEGORY_OPTIONS,
  EMPTY_FILTERS,
  POSITIONS,
  SORT_LABELS,
  type AthleteOverview,
  type Filters,
  type SortKey,
} from "@/lib/consultant";

/**
 * Explorador de atletas.
 *
 * Toda a filtragem acontece no navegador, com a lista já carregada. Com
 * algumas centenas de atletas isso responde a cada tecla sem ida ao servidor —
 * mais rápido que qualquer consulta. Passando de alguns milhares, vale mover
 * a busca para o banco.
 */
export function AthleteExplorer({
  athletes,
}: {
  athletes: AthleteOverview[];
}) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sortKey, setSortKey] = useState<SortKey>("atividade");

  const visible = useMemo(
    () => sortAthletes(filterAthletes(athletes, filters), sortKey),
    [athletes, filters, sortKey],
  );

  const summary = useMemo(() => summarizeSelection(visible), [visible]);

  const hasFilters =
    filters.query !== "" ||
    filters.positions.length > 0 ||
    filters.categories.length > 0 ||
    filters.steps.length > 0 ||
    filters.onlyVisible ||
    filters.onlyWithStats;

  function toggle<T>(list: T[], value: T): T[] {
    return list.includes(value)
      ? list.filter((v) => v !== value)
      : [...list, value];
  }

  return (
    <>
      <div className="rounded-2xl border border-line bg-white p-4">
        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            value={filters.query}
            onChange={(e) =>
              setFilters((f) => ({ ...f, query: e.target.value }))
            }
            placeholder="Buscar por nome, clube, posição, responsável, ano…"
            aria-label="Buscar atletas"
            className="w-full rounded-xl border border-line bg-white py-3 pl-11 pr-10 text-ink outline-none transition-colors focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
          />
          {filters.query && (
            <button
              onClick={() => setFilters((f) => ({ ...f, query: "" }))}
              aria-label="Limpar busca"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
            >
              <X size={18} aria-hidden />
            </button>
          )}
        </div>

        <div className="mt-3 space-y-2.5">
          <FilterRow label="Posição">
            {POSITIONS.map((position) => (
              <Chip
                key={position}
                active={filters.positions.includes(position)}
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    positions: toggle(f.positions, position as string),
                  }))
                }
              >
                {position}
              </Chip>
            ))}
          </FilterRow>

          <FilterRow label="Categoria">
            {CATEGORY_OPTIONS.map((category) => (
              <Chip
                key={category}
                active={filters.categories.includes(category)}
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    categories: toggle(f.categories, category as number),
                  }))
                }
              >
                Sub-{category}
              </Chip>
            ))}
          </FilterRow>

          <FilterRow label="Degrau">
            {[3, 2, 1].map((step) => (
              <Chip
                key={step}
                active={filters.steps.includes(step)}
                onClick={() =>
                  setFilters((f) => ({ ...f, steps: toggle(f.steps, step) }))
                }
              >
                Degrau {step}
              </Chip>
            ))}
            <Chip
              active={filters.onlyWithStats}
              onClick={() =>
                setFilters((f) => ({ ...f, onlyWithStats: !f.onlyWithStats }))
              }
            >
              Só com jogos registrados
            </Chip>
            <Chip
              active={filters.onlyVisible}
              onClick={() =>
                setFilters((f) => ({ ...f, onlyVisible: !f.onlyVisible }))
              }
            >
              Só visíveis a parceiros
            </Chip>
          </FilterRow>
        </div>

        {hasFilters && (
          <button
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="mt-3 text-xs text-navy-900 underline"
          >
            Limpar tudo
          </button>
        )}
      </div>

      {/* Resumo da seleção: responde "o que eu tenho em mãos agora". */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl bg-navy-50 px-4 py-3 text-sm">
        <span className="font-semibold text-navy-900">
          {summary.count}{" "}
          {summary.count === 1 ? "atleta" : "atletas"}
        </span>
        <span className="text-muted">
          <strong className="tabular-nums text-ink">{summary.goals}</strong> gols
        </span>
        <span className="text-muted">
          <strong className="tabular-nums text-ink">{summary.assists}</strong>{" "}
          assistências
        </span>
        <span className="text-muted">
          <strong className="tabular-nums text-ink">
            {formatMinutes(summary.minutes)}
          </strong>{" "}
          em campo
        </span>
        {summary.hidden > 0 && (
          <span className="flex items-center gap-1.5 text-muted">
            <EyeOff size={14} aria-hidden />
            {summary.hidden} fora da vitrine
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setSortKey(key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              key === sortKey
                ? "bg-navy-900 text-white"
                : "border border-line bg-white text-muted"
            }`}
          >
            {SORT_LABELS[key]}
          </button>
        ))}
      </div>

      <div className="mt-3">
        <AthleteTable athletes={visible} />
      </div>
    </>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="w-16 shrink-0 text-xs font-medium text-muted">
        {label}
      </span>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-navy-900 text-white"
          : "border border-line bg-white text-muted hover:border-navy-300"
      }`}
    >
      {children}
    </button>
  );
}
