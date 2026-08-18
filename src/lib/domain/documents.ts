/**
 * Documentos e prazos.
 *
 * Documentação vencida é uma das causas mais comuns de um moleque ficar de
 * fora de um jogo — e quase sempre por esquecimento, não por falta de tempo.
 * Por isso o alerta é o coração deste módulo; o anexo é a conveniência.
 */

export const DOCUMENT_KINDS = [
  { value: "atestado", label: "Atestado médico", defaultMonths: 12 },
  { value: "exame", label: "Exame médico / cardiológico", defaultMonths: 12 },
  { value: "federacao", label: "Registro na federação", defaultMonths: 12 },
  { value: "identidade", label: "RG / Certidão de nascimento", defaultMonths: null },
  { value: "cpf", label: "CPF", defaultMonths: null },
  { value: "escolar", label: "Comprovante de matrícula escolar", defaultMonths: 12 },
  { value: "autorizacao", label: "Autorização dos responsáveis", defaultMonths: 12 },
  { value: "contrato", label: "Contrato / termo do clube", defaultMonths: null },
  { value: "outro", label: "Outro", defaultMonths: null },
] as const;

export type DocumentKind = (typeof DOCUMENT_KINDS)[number]["value"];

export type DocumentStatus = "vencido" | "vencendo" | "valido" | "sem_prazo";

/** Janela de aviso: 30 dias costuma bastar para agendar consulta e renovar. */
export const WARNING_DAYS = 30;

export function documentStatus(
  expiresOn: string | null,
  today: Date = new Date(),
): { status: DocumentStatus; days: number | null } {
  if (!expiresOn) return { status: "sem_prazo", days: null };

  const [y, m, d] = expiresOn.split("-").map(Number);
  const expiry = new Date(y, m - 1, d);
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((expiry.getTime() - base.getTime()) / 86_400_000);

  if (days < 0) return { status: "vencido", days };
  if (days <= WARNING_DAYS) return { status: "vencendo", days };
  return { status: "valido", days };
}

/**
 * Cores de estado — reservadas, nunca reaproveitadas como cor de categoria.
 * Sempre acompanhadas de texto: a cor não carrega o significado sozinha.
 */
export const STATUS_STYLE: Record<
  DocumentStatus,
  { label: (days: number | null) => string; className: string }
> = {
  vencido: {
    label: (days) =>
      days === null
        ? "Vencido"
        : `Vencido há ${Math.abs(days)} ${Math.abs(days) === 1 ? "dia" : "dias"}`,
    className: "bg-red-50 text-red-800",
  },
  vencendo: {
    label: (days) =>
      days === 0
        ? "Vence hoje"
        : `Vence em ${days} ${days === 1 ? "dia" : "dias"}`,
    className: "bg-amber-50 text-amber-900",
  },
  valido: {
    label: (days) => `Válido por mais ${days} dias`,
    className: "bg-emerald-50 text-emerald-800",
  },
  sem_prazo: {
    label: () => "Sem prazo de validade",
    className: "bg-fundo-2 text-tinta",
  },
};

/** Ordena por urgência: vencidos primeiro, depois os que vencem antes. */
export function byUrgency(
  a: { expires_on: string | null },
  b: { expires_on: string | null },
): number {
  if (!a.expires_on && !b.expires_on) return 0;
  if (!a.expires_on) return 1;
  if (!b.expires_on) return -1;
  return a.expires_on.localeCompare(b.expires_on);
}

export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
];
