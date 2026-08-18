/**
 * Tema visual do app. O CLARO é o padrão para todo mundo — não seguimos
 * prefers-color-scheme na primeira visita, por decisão de produto.
 *
 * Este arquivo é NEUTRO de propósito: só tipos e constantes. A leitura do
 * cookie mora em `tema-server.ts` porque depende de `next/headers`, e o
 * SeletorTema é um componente de cliente — se as duas coisas ficassem juntas,
 * o import do cliente arrastaria código de servidor e o build quebraria.
 */
export type Tema = "claro" | "escuro";

export const TEMA_COOKIE = "tema";
export const TEMA_PADRAO: Tema = "claro";
export const TEMA_MAX_AGE = 60 * 60 * 24 * 365;

export function normalizarTema(valor: string | undefined | null): Tema {
  return valor === "escuro" ? "escuro" : TEMA_PADRAO;
}
