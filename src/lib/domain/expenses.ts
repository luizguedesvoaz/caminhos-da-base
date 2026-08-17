/**
 * Módulo financeiro — "o ativo em construção".
 *
 * REGRA INEGOCIÁVEL: todo valor trafega e é gravado em CENTAVOS, como número
 * inteiro. 1999 = R$ 19,99. Ponto flutuante em dinheiro acumula erro de
 * centavos justamente no número mais importante do produto — o total investido,
 * que o pai confere e compara. Um centavo de divergência destrói a confiança.
 */

export const EXPENSE_CATEGORIES = {
  mensalidade: { label: "Mensalidade", hint: "Escolinha, clube, projeto" },
  federacao: { label: "Federação e documentação", hint: "Registro, taxas, certidões" },
  competicao: { label: "Competição", hint: "Inscrição, arbitragem, taxas" },
  equipamento: { label: "Equipamento", hint: "Chuteira, uniforme, material" },
  transporte: { label: "Transporte", hint: "Deslocamento para treino e jogo" },
  avaliacao: { label: "Avaliação médica e física", hint: "Exames, consultas, testes" },
  app: { label: "Custo do app", hint: "Assinatura do Caminhos da Base" },
  outros: { label: "Outros", hint: "O que não se encaixa acima" },
} as const;

export type ExpenseCategory = keyof typeof EXPENSE_CATEGORIES;

export const EXPENSE_CATEGORY_KEYS = Object.keys(
  EXPENSE_CATEGORIES,
) as ExpenseCategory[];

/**
 * Converte o que o usuário digitou para centavos.
 *
 * Aceita as formas que um brasileiro realmente digita no celular:
 *   "150"        -> 15000
 *   "150,50"     -> 15050
 *   "1.250,90"   -> 125090
 *   "R$ 89,90"   -> 8990
 *   "150.50"     -> 15050   (ponto como decimal, teclado numérico)
 *
 * Retorna null quando não dá para interpretar com segurança — melhor recusar
 * do que gravar um valor errado no total investido.
 */
export function parseAmountToCents(input: string): number | null {
  const cleaned = input.replace(/[^\d.,-]/g, "").trim();
  if (!cleaned || /-/.test(cleaned)) return null;

  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  let normalized: string;

  if (hasComma && hasDot) {
    // Formato brasileiro completo: ponto é milhar, vírgula é decimal.
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    normalized = cleaned.replace(",", ".");
  } else if (hasDot) {
    const [, decimals = ""] = cleaned.split(".");
    // "1.250" é mil duzentos e cinquenta (milhar), "150.50" é decimal.
    normalized = decimals.length === 3 ? cleaned.replace(/\./g, "") : cleaned;
  } else {
    normalized = cleaned;
  }

  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;

  // Arredonda no fim, uma única vez, para não propagar erro de ponto flutuante.
  return Math.round(value * 100);
}

/** Formata centavos como moeda brasileira. */
export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Versão compacta para espaços apertados: R$ 1,2 mil. */
export function formatCentsShort(cents: number): string {
  const reais = cents / 100;
  if (reais >= 1000) {
    return `R$ ${(reais / 1000).toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
    })} mil`;
  }
  return formatCents(cents);
}

export const MONTH_NAMES = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];
