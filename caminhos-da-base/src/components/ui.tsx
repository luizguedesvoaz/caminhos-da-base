import Link from "next/link";
import type { ComponentProps } from "react";

export function Card({
  className = "",
  ...props
}: ComponentProps<"section">) {
  return (
    <section
      className={`rounded-2xl border border-line bg-white p-5 shadow-sm ${className}`}
      {...props}
    />
  );
}

const buttonBase =
  "inline-flex w-full items-center justify-center rounded-xl px-5 py-3.5 text-base font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: "primary" | "gold" | "ghost" }) {
  const styles = {
    primary: "bg-navy-900 text-white hover:bg-navy-700",
    gold: "bg-gold-500 text-navy-900 hover:bg-gold-400",
    ghost: "border border-line bg-white text-ink hover:bg-navy-50",
  }[variant];
  return <button className={`${buttonBase} ${styles} ${className}`} {...props} />;
}

export function LinkButton({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: "primary" | "gold" | "ghost" }) {
  const styles = {
    primary: "bg-navy-900 text-white hover:bg-navy-700",
    gold: "bg-gold-500 text-navy-900 hover:bg-gold-400",
    ghost: "border border-line bg-white text-ink hover:bg-navy-50",
  }[variant];
  return <Link className={`${buttonBase} ${styles} ${className}`} {...props} />;
}

export function Field({
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
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-ink outline-none transition-colors focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20";

export function ErrorMessage({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
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
