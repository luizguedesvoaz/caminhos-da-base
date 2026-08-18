"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListChecks, Trophy, Wallet, Medal } from "lucide-react";

/**
 * Cinco itens é o limite confortável para o polegar num celular. Conquistas
 * entra no lugar de Perfil, que passa a ser alcançado pelo nome do atleta no
 * topo — gamificação precisa estar visível para funcionar, perfil é consultado
 * uma vez e esquecido.
 *
 * Os rótulos são os do desenho novo: "Semana" em vez de "Tarefas" (o que a
 * pessoa fecha é a semana, não uma lista) e "Custo" em vez de "Gastos".
 */
const ITEMS = [
  { href: "/inicio", label: "Início", Icon: Home },
  { href: "/tarefas", label: "Semana", Icon: ListChecks },
  { href: "/temporada", label: "Temporada", Icon: Trophy },
  { href: "/financeiro", label: "Custo", Icon: Wallet },
  { href: "/conquistas", label: "Selos", Icon: Medal },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-contorno bg-fundo-2"
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
                className="flex min-h-11 flex-col items-center gap-1 py-2"
              >
                <span
                  className={`flex h-[26px] w-9 items-center justify-center rounded-[9px] transition-colors ${
                    active ? "bg-acento text-acento-tinta" : "text-tinta-2"
                  }`}
                >
                  <Icon size={18} strokeWidth={2} aria-hidden />
                </span>
                <span
                  className={`text-[11px] font-bold ${
                    active ? "text-tinta dark:text-acento" : "text-tinta-2"
                  }`}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
