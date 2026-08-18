import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * Bloco — a superfície do desenho novo. Contorno de 2px, raio 20px, nenhuma
 * sombra difusa. A sombra, quando existe, é sólida (claro) ou brilho do acento
 * (escuro): quem decide é o token --sombra-*, não o componente.
 */
export function Bloco({
  enfase = "plano",
  className = "",
  ...props
}: ComponentProps<"section"> & { enfase?: "plano" | "destaque" | "heroi" }) {
  const sombra = {
    plano: "",
    destaque: "shadow-[var(--sombra-bloco)]",
    heroi: "shadow-[var(--sombra-heroi)]",
  }[enfase];

  return (
    <section
      className={`rounded-[var(--radius-bloco)] border-2 border-contorno bg-fundo p-4 ${sombra} ${className}`}
      {...props}
    />
  );
}

const botaoBase =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 px-5 py-3.5 text-base font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

/**
 * Variantes:
 *  acento   — ação primária (limão). O CTA de todo dia.
 *  jogo     — OURO, restrito a dia de jogo: "Registrar jogo", confirmar partida.
 *             Não usar como destaque genérico; o ouro só significa partida.
 *  primaria — marinho, ações administrativas (cadastro, vínculo).
 *  fantasma — apenas contorno.
 */
const variantes = {
  acento:
    "border-contorno bg-acento text-acento-tinta shadow-[var(--sombra-bloco)] hover:bg-[color-mix(in_oklab,var(--acento),black_8%)]",
  jogo:
    "border-contorno bg-jogo text-jogo-tinta shadow-[var(--sombra-bloco)] hover:bg-[color-mix(in_oklab,var(--jogo),black_8%)]",
  primaria:
    "border-marinho-fundo bg-marinho-fundo text-marinho-tinta hover:bg-[color-mix(in_oklab,var(--marinho-fundo),white_10%)]",
  fantasma: "border-contorno bg-transparent text-tinta hover:bg-fundo-2",
} as const;

type Variante = keyof typeof variantes;

export function Botao({
  variante = "acento",
  className = "",
  ...props
}: ComponentProps<"button"> & { variante?: Variante }) {
  return (
    <button
      className={`${botaoBase} ${variantes[variante]} ${className}`}
      {...props}
    />
  );
}

export function BotaoLink({
  variante = "acento",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variante?: Variante }) {
  return (
    <Link
      className={`${botaoBase} ${variantes[variante]} ${className}`}
      {...props}
    />
  );
}

/** Rótulo caixa-alta — o rótulo padrão de bloco e de métrica. */
export function Rotulo({ className = "", ...props }: ComponentProps<"p">) {
  return (
    <p
      className={`text-xs font-bold uppercase tracking-[.16em] text-tinta-2 ${className}`}
      {...props}
    />
  );
}

/** Título de tela: Bricolage 800, 34px. */
export function TituloTela({ className = "", ...props }: ComponentProps<"h1">) {
  return (
    <h1
      className={`font-display text-[34px] font-extrabold leading-none tracking-[-.03em] text-tinta ${className}`}
      {...props}
    />
  );
}

/** Título de bloco: Bricolage 800, 19px. */
export function TituloBloco({ className = "", ...props }: ComponentProps<"h2">) {
  return (
    <h2
      className={`font-display text-[19px] font-extrabold leading-none tracking-[-.02em] text-tinta ${className}`}
      {...props}
    />
  );
}

/** Número-placar: minutagem, 4/10, sequência. O elemento mais alto da hierarquia. */
export function Placar({
  tamanho = 84,
  className = "",
  ...props
}: ComponentProps<"p"> & { tamanho?: number }) {
  return (
    <p
      style={{ fontSize: `${tamanho}px` }}
      className={`font-display font-extrabold leading-[.84] tracking-[-.04em] tabular text-tinta ${className}`}
      {...props}
    />
  );
}

/** Chip pílula. `tom` decide se é seleção (acento), partida (ouro) ou neutro. */
export function Chip({
  tom = "neutro",
  className = "",
  ...props
}: ComponentProps<"span"> & { tom?: "neutro" | "acento" | "jogo" | "alerta" }) {
  const tons = {
    neutro: "border-contorno bg-fundo text-tinta",
    acento: "border-contorno bg-acento text-acento-tinta",
    jogo: "border-contorno bg-jogo text-jogo-tinta",
    alerta: "border-alerta bg-alerta-fundo text-alerta-tinta",
  }[tom];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-xs font-bold ${tons} ${className}`}
      {...props}
    />
  );
}

export function Campo({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-tinta">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-tinta-2">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-[var(--radius-linha)] border-2 border-contorno bg-fundo px-4 py-3 text-tinta outline-none transition-colors focus:border-contorno-forte";

export function MensagemErro({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="rounded-[var(--radius-linha)] border-2 border-alerta bg-alerta-fundo px-4 py-3 text-sm text-alerta-tinta"
    >
      {children}
    </p>
  );
}

/** Formata centavos como moeda brasileira. Dinheiro é sempre inteiro. */
export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/* ---------------------------------------------------------------------------
   Ponte para as telas ainda não redesenhadas (Financeiro, Conquistas, Perfil,
   Documentos, painel do consultor). Elas continuam importando `Card`, `Button`,
   `Field` e `ErrorMessage` — aqui esses nomes viram o componente novo, então
   herdam o desenho e os dois temas sem precisar ser reescritas agora.
   Some quando o redesenho chegar nessas telas.
   --------------------------------------------------------------------------- */

/** @deprecated use `Bloco` */
export const Card = Bloco;

/** @deprecated use `Campo` */
export const Field = Campo;

/** @deprecated use `MensagemErro` */
export const ErrorMessage = MensagemErro;

const VARIANTE_LEGADA = {
  primary: "primaria",
  gold: "acento",
  ghost: "fantasma",
} as const;

type VarianteLegada = keyof typeof VARIANTE_LEGADA;

/** @deprecated use `Botao` */
export function Button({
  variant = "primary",
  ...props
}: ComponentProps<"button"> & { variant?: VarianteLegada }) {
  return <Botao variante={VARIANTE_LEGADA[variant]} {...props} />;
}

/** @deprecated use `BotaoLink` */
export function LinkButton({
  variant = "primary",
  ...props
}: ComponentProps<typeof Link> & { variant?: VarianteLegada }) {
  return <BotaoLink variante={VARIANTE_LEGADA[variant]} {...props} />;
}
