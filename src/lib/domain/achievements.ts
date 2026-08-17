/**
 * Conquistas — premiam PROCESSO, nunca desempenho comparado.
 *
 * DECISÃO DE PRODUTO REGISTRADA: não existe ranking entre atletas, nem selo
 * por gol, vitória ou destaque. Comparação pública entre crianças em futebol
 * de base alimenta pai tóxico e respinga na marca da consultoria.
 *
 * Todo selo aqui mede algo que a família CONTROLA: aparecer no treino, manter
 * a escola em dia, respeitar o descanso, não deixar documento vencer. É a
 * mensagem da palestra transformada em recompensa.
 *
 * Os selos são CALCULADOS a partir dos dados, não guardados em tabela. Assim
 * nunca ficam dessincronizados do que realmente aconteceu — se uma tarefa for
 * excluída, o selo correspondente reflete isso na hora.
 */

import type { TaskCategory } from "@/lib/domain/tasks";

export type CompletedTask = {
  category: TaskCategory;
  completed_at: string | null;
};

export type Achievement = {
  key: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  unlocked: boolean;
};

/** Semana ISO de uma data, para medir constância sem depender do dia exato. */
function weekKey(iso: string): string {
  const date = new Date(iso);
  const thursday = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  thursday.setUTCDate(thursday.getUTCDate() + 3 - ((thursday.getUTCDay() + 6) % 7));
  const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((thursday.getTime() - firstThursday.getTime()) / 86_400_000 -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7,
    );
  return `${thursday.getUTCFullYear()}-${String(week).padStart(2, "0")}`;
}

/**
 * Maior sequência de semanas consecutivas com ao menos uma tarefa concluída
 * na categoria. Mede constância — o que a formação realmente exige.
 */
export function weeklyStreak(
  tasks: CompletedTask[],
  category?: TaskCategory,
): number {
  const weeks = new Set<string>();
  for (const task of tasks) {
    if (!task.completed_at) continue;
    if (category && task.category !== category) continue;
    weeks.add(weekKey(task.completed_at));
  }
  if (weeks.size === 0) return 0;

  const sorted = [...weeks].sort();
  let best = 1;
  let run = 1;

  for (let i = 1; i < sorted.length; i++) {
    if (areConsecutive(sorted[i - 1], sorted[i])) {
      run++;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

function areConsecutive(a: string, b: string): boolean {
  const [ya, wa] = a.split("-").map(Number);
  const [yb, wb] = b.split("-").map(Number);
  if (ya === yb) return wb === wa + 1;
  // Virada de ano: semana 52 ou 53 seguida da semana 1 do ano seguinte.
  return yb === ya + 1 && wb === 1 && wa >= 52;
}

function countBy(tasks: CompletedTask[], category: TaskCategory): number {
  return tasks.filter((t) => t.category === category).length;
}

export function computeAchievements(input: {
  completedTasks: CompletedTask[];
  matchesRegistered: number;
  documentsTotal: number;
  documentsExpired: number;
  expensesRegistered: number;
}): Achievement[] {
  const { completedTasks: done } = input;

  const definitions: Achievement[] = [
    {
      key: "primeiros_passos",
      title: "Primeiros passos",
      description: "Concluir 5 tarefas",
      progress: Math.min(done.length, 5),
      target: 5,
      unlocked: done.length >= 5,
    },
    {
      key: "constancia_treino",
      title: "Constância",
      description: "4 semanas seguidas com treino registrado",
      progress: Math.min(weeklyStreak(done, "treino"), 4),
      target: 4,
      unlocked: weeklyStreak(done, "treino") >= 4,
    },
    {
      key: "escola_em_dia",
      title: "Escola em dia",
      description: "Concluir 5 tarefas de escola",
      progress: Math.min(countBy(done, "escola"), 5),
      target: 5,
      unlocked: countBy(done, "escola") >= 5,
    },
    {
      key: "descanso_respeitado",
      title: "Descanso respeitado",
      description: "Concluir 4 tarefas de saúde e recuperação",
      progress: Math.min(countBy(done, "saude"), 4),
      target: 4,
      unlocked: countBy(done, "saude") >= 4,
    },
    {
      key: "papelada_em_ordem",
      title: "Papelada em ordem",
      description: "Ter documentos cadastrados e nenhum vencido",
      progress:
        input.documentsTotal > 0 && input.documentsExpired === 0 ? 1 : 0,
      target: 1,
      unlocked: input.documentsTotal > 0 && input.documentsExpired === 0,
    },
    {
      key: "temporada_registrada",
      title: "Temporada registrada",
      description: "Registrar 5 jogos com minutagem",
      progress: Math.min(input.matchesRegistered, 5),
      target: 5,
      unlocked: input.matchesRegistered >= 5,
    },
    {
      key: "olho_no_investimento",
      title: "Olho no investimento",
      description: "Registrar 10 gastos do atleta",
      progress: Math.min(input.expensesRegistered, 10),
      target: 10,
      unlocked: input.expensesRegistered >= 10,
    },
    {
      key: "meio_ano_junto",
      title: "Meio ano de rotina",
      description: "26 semanas com pelo menos uma tarefa concluída",
      progress: Math.min(weeklyStreak(done), 26),
      target: 26,
      unlocked: weeklyStreak(done) >= 26,
    },
  ];

  return definitions;
}

export function formatCoins(amount: number): string {
  return amount.toLocaleString("pt-BR");
}
