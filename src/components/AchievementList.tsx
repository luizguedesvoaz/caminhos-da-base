import { Check } from "lucide-react";
import type { Achievement } from "@/lib/domain/achievements";

/**
 * Selos com barra de progresso.
 *
 * O progresso aparece mesmo nos bloqueados — saber que falta uma semana para
 * fechar "Constância" motiva mais do que um cadeado sem informação. E o estado
 * nunca é comunicado só por cor: há ícone e número.
 */
export function AchievementList({
  achievements,
}: {
  achievements: Achievement[];
}) {
  return (
    <ul className="space-y-2">
      {achievements.map((item) => (
        <li
          key={item.key}
          className={`rounded-xl border p-3.5 ${
            item.unlocked
              ? "border-gold-500 bg-gold-500/10"
              : "border-line bg-white"
          }`}
        >
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${
                item.unlocked ? "bg-gold-500 text-navy-900" : "bg-navy-900/10"
              }`}
            >
              {item.unlocked ? (
                <Check size={16} strokeWidth={3} />
              ) : (
                <span className="text-xs font-bold text-navy-900/50">
                  {Math.round((item.progress / item.target) * 100)}
                </span>
              )}
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{item.title}</p>
              <p className="mt-0.5 text-xs text-muted">{item.description}</p>

              {!item.unlocked && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-navy-900/8">
                    <div
                      className="h-full rounded-full bg-navy-700"
                      style={{
                        width: `${Math.max((item.progress / item.target) * 100, 2)}%`,
                      }}
                    />
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-muted">
                    {item.progress}/{item.target}
                  </span>
                </div>
              )}

              {item.unlocked && (
                <p className="mt-1.5 text-xs font-medium text-gold-600">
                  Conquistado
                </p>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
