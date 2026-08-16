"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListChecks, Trophy, Wallet, User } from "lucide-react";

const ITEMS = [
  { href: "/inicio", label: "Início", Icon: Home },
  { href: "/tarefas", label: "Tarefas", Icon: ListChecks },
  { href: "/temporada", label: "Temporada", Icon: Trophy },
  { href: "/financeiro", label: "Gastos", Icon: Wallet },
  { href: "/perfil", label: "Perfil", Icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-md">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  active ? "text-navy-900" : "text-muted"
                }`}
              >
                <Icon size={21} strokeWidth={active ? 2.4 : 1.8} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
