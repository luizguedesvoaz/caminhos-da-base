"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListChecks, Trophy, Wallet, Medal } from "lucide-react";

/**
 * Cinco itens é o limite confortável para o polegar num celular. Conquistas
 * entra no lugar de Perfil, que passa a ser alcançado pelo nome do atleta no
 * topo — gamificação precisa estar visível para funcionar, perfil é consultado
 * uma vez e esquecido.
 */
const ITEMS = [
  { href: "/inicio", label: "Início", Icon: Home },
  { href: "/tarefas", label: "Tarefas", Icon: ListChecks },
  { href: "/temporada", label: "Temporada", Icon: Trophy },
  { href: "/financeiro", label: "Gastos", Icon: Wallet },
  { href: "/conquistas", label: "Conquistas", Icon: Medal },
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
                /* Sem pré-carregamento: cada busca em segundo plano abre uma
                   sessão no servidor e disputa a renovação do token, o que
                   derrubava a sessão do usuário. O ganho de velocidade não
                   compensa o risco. */
                prefetch={false}
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
