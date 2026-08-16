/**
 * REGRA CRÍTICA DE DOMÍNIO — categoria no futebol de base brasileiro.
 *
 * A categoria é definida pelo ANO DE NASCIMENTO, não pela idade do atleta.
 * Um atleta nascido em 2013 disputa o sub-13 durante toda a temporada 2026,
 * mesmo completando 14 anos em março.
 *
 * Calcular por idade produz erro em aproximadamente metade dos casos —
 * exatamente os atletas que já fizeram aniversário na temporada corrente.
 */

/** Categorias oficiais disputadas no futebol de base. */
export const CATEGORIES = [7, 9, 11, 13, 15, 17, 20] as const;
export type Category = (typeof CATEGORIES)[number];

/** Idade que o atleta completa dentro da temporada. */
export function ageInSeason(birthYear: number, seasonYear: number): number {
  return seasonYear - birthYear;
}

/**
 * Categoria em que o atleta joga na temporada.
 * A idade da temporada é arredondada para cima até a categoria oficial:
 * quem completa 12 anos em 2026 joga o sub-13.
 */
export function categoryFor(
  birthYear: number,
  seasonYear: number,
): Category | null {
  const age = ageInSeason(birthYear, seasonYear);
  if (age < 6) return null; // ainda fora da faixa atendida
  const category = CATEGORIES.find((c) => age <= c);
  return category ?? null; // acima de sub-20 já é profissional
}

/**
 * Ano do atleta dentro da categoria.
 *
 * Cada categoria comporta dois anos de nascimento. Quem está no primeiro ano
 * é o mais novo do grupo e naturalmente joga menos minutos; quem está no
 * segundo ano é o mais velho. Exibir isso calibra a expectativa da família e
 * é um dos principais diferenciais do produto.
 */
export type CategoryYear = "primeiro" | "segundo";

export function categoryYear(
  birthYear: number,
  seasonYear: number,
): CategoryYear | null {
  const category = categoryFor(birthYear, seasonYear);
  if (category === null) return null;
  const age = ageInSeason(birthYear, seasonYear);
  // O atleta na idade exata da categoria é o mais velho dela.
  return age === category ? "segundo" : "primeiro";
}

/** Rótulo de exibição: "Sub-13". */
export function categoryLabel(category: Category | null): string {
  return category === null ? "—" : `Sub-${category}`;
}

/**
 * Frase explicativa do ano na categoria, em linguagem para a família.
 * Sem jargão: o público majoritário são pais, não especialistas.
 */
export function categoryYearExplanation(
  year: CategoryYear | null,
  category: Category | null,
): string | null {
  if (year === null || category === null) return null;
  if (year === "primeiro") {
    return `Está no primeiro ano do Sub-${category} — é um dos mais novos da categoria. É comum jogar menos minutos nesta fase, e isso faz parte do processo.`;
  }
  return `Está no segundo ano do Sub-${category} — é um dos mais velhos da categoria. Costuma ser o ano de maior participação em campo.`;
}

/** Contrato de formação só é permitido a partir dos 14 anos (Lei Pelé). */
export const FORMATION_CONTRACT_MIN_AGE = 14;

export function canSignFormationContract(
  birthYear: number,
  seasonYear: number,
): boolean {
  return ageInSeason(birthYear, seasonYear) >= FORMATION_CONTRACT_MIN_AGE;
}

/** A partir dos 13 anos o atleta pode ter login próprio. */
export const ATHLETE_LOGIN_MIN_AGE = 13;

export function canHaveOwnLogin(
  birthYear: number,
  seasonYear: number,
): boolean {
  return ageInSeason(birthYear, seasonYear) >= ATHLETE_LOGIN_MIN_AGE;
}

/** Temporada corrente. No Brasil a temporada de base é o ano civil. */
export function currentSeason(now: Date = new Date()): number {
  return now.getFullYear();
}
