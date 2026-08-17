import Link from "next/link";
import { requireConsultant } from "@/lib/consultant-guard";
import { BRAND } from "@/lib/config";

/**
 * O painel tem navegação própria, mais larga que o app da família: aqui o uso
 * é de trabalho, muitas vezes no computador, com listas e comparações.
 */
export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { name } = await requireConsultant();

  const links = [
    { href: "/painel", label: "Visão geral" },
    { href: "/painel/entradas", label: "Entradas" },
    { href: "/painel/regras", label: "Regras" },
  ];

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-white">
        <div className="mx-auto max-w-5xl px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">
                Painel do consultor
              </p>
              <h1 className="text-lg font-bold text-navy-900">{BRAND.name}</h1>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted">{name}</span>
              <Link href="/inicio" prefetch={false} className="text-navy-900 underline">
                Ver como família
              </Link>
              <Link href="/sair" prefetch={false} className="text-muted underline">
                Sair
              </Link>
            </div>
          </div>

          <nav className="mt-4 flex gap-1 overflow-x-auto">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-navy-50"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-6">{children}</main>
    </div>
  );
}
