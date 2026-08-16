/**
 * Categorias de tarefa — fixas, com ícone e cor para escaneabilidade rápida.
 *
 * As cores vêm da paleta categórica validada para daltonismo (slots 1 a 6).
 * Verificado com o validador: separação CVD mínima ΔE 9.1 (protanopia) e
 * ΔE 19.6 em visão normal — ambos acima do piso exigido.
 *
 * A cor NUNCA carrega significado sozinha: toda categoria aparece sempre
 * acompanhada de ícone e rótulo em texto.
 */

export const TASK_CATEGORIES = {
  treino: {
    label: "Treino",
    color: "#2a78d6",
    description: "Treino técnico, físico, jogo",
  },
  escola: {
    label: "Escola",
    color: "#eb6834",
    description: "Prova, trabalho, reunião de pais",
  },
  saude: {
    label: "Saúde",
    color: "#1baf7a",
    description: "Consulta, fisioterapia, descanso",
  },
  documentacao: {
    label: "Documentação",
    color: "#eda100",
    description: "Federação, exame médico, atestado",
  },
  desenvolvimento: {
    label: "Desenvolvimento",
    color: "#e87ba4",
    description: "Assistir jogo, treino por conta própria",
  },
  jogo: {
    label: "Jogo",
    color: "#008300",
    description: "Partidas e competições",
  },
} as const;

export type TaskCategory = keyof typeof TASK_CATEGORIES;

export const TASK_CATEGORY_KEYS = Object.keys(TASK_CATEGORIES) as TaskCategory[];

/** Sugestões iniciais por degrau da pirâmide, exibidas quando não há tarefas. */
export const SUGGESTED_TASKS: Record<
  number,
  { title: string; category: TaskCategory }[]
> = {
  1: [
    { title: "Confirmar dias e horários de treino da semana", category: "treino" },
    { title: "Agendar avaliação física inicial", category: "saude" },
    { title: "Separar certidão de nascimento, CPF e RG", category: "documentacao" },
    { title: "Conferir boletim e datas de prova", category: "escola" },
  ],
  2: [
    { title: "Conferir validade do exame médico", category: "documentacao" },
    { title: "Registrar os jogos da competição atual", category: "jogo" },
    { title: "Marcar um dia de descanso na semana", category: "saude" },
    { title: "Assistir a um jogo junto e conversar sobre ele", category: "desenvolvimento" },
  ],
  3: [
    { title: "Conferir inscrição federativa da temporada", category: "documentacao" },
    { title: "Acompanhar minutos em campo nos últimos jogos", category: "jogo" },
    { title: "Revisar rotina escolar do semestre", category: "escola" },
    { title: "Agendar avaliação física de acompanhamento", category: "saude" },
  ],
};

/** Dias da semana para a recorrência. Domingo = 0, como no JavaScript. */
export const WEEKDAYS = [
  { value: 0, short: "D", label: "Domingo" },
  { value: 1, short: "S", label: "Segunda" },
  { value: 2, short: "T", label: "Terça" },
  { value: 3, short: "Q", label: "Quarta" },
  { value: 4, short: "Q", label: "Quinta" },
  { value: 5, short: "S", label: "Sexta" },
  { value: 6, short: "S", label: "Sábado" },
] as const;

/** Quantas semanas à frente uma tarefa recorrente é gerada. */
export const RECURRENCE_WEEKS = 8;

/**
 * Gera as datas de uma tarefa semanal recorrente.
 *
 * Optamos por criar as ocorrências como linhas reais no banco, em vez de
 * calcular na hora da leitura. Isso mantém consulta e conclusão simples —
 * cada dia tem sua própria tarefa, que pode ser concluída ou editada sozinha.
 */
export function weeklyOccurrences(
  startDate: Date,
  weekdays: number[],
  weeks: number = RECURRENCE_WEEKS,
): string[] {
  if (weekdays.length === 0) return [];

  const dates: string[] = [];
  const cursor = new Date(startDate);
  cursor.setHours(12, 0, 0, 0); // meio-dia evita virada de fuso horário

  for (let day = 0; day < weeks * 7; day++) {
    if (weekdays.includes(cursor.getDay())) {
      dates.push(toISODate(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

/** Data em AAAA-MM-DD no fuso local, sem passar por UTC. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Rótulo amigável: "Hoje", "Amanhã", "Ontem" ou "seg, 18 ago". */
export function friendlyDate(iso: string, today: Date = new Date()): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.round((date.getTime() - base.getTime()) / 86_400_000);

  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  if (diff === -1) return "Ontem";

  return date.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
