"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Check } from "lucide-react";
import { switchAthlete } from "@/app/(app)/actions";
import type { AthleteRow } from "@/lib/athlete";

/**
 * Cabeçalho com o atleta em foco. Só vira um seletor quando o responsável
 * tem mais de um filho — para quem tem um só, é apenas um título.
 */
export function AthleteHeader({
  athlete,
  all,
  subtitle,
}: {
  athlete: AthleteRow;
  all: AthleteRow[];
  subtitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const firstName = athlete.full_name.split(" ")[0];

  if (all.length <= 1) {
    return (
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-tinta">{firstName}</h1>
        <p className="text-sm text-tinta-2">{subtitle}</p>
      </header>
    );
  }

  return (
    <header className="relative mb-5">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1.5 text-left"
        disabled={pending}
      >
        <span className="text-2xl font-bold text-tinta">{firstName}</span>
        <ChevronDown
          size={20}
          className={`text-tinta-2 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      <p className="text-sm text-tinta-2">{subtitle}</p>

      {open && (
        <ul className="absolute left-0 top-full z-30 mt-2 w-64 overflow-hidden rounded-xl border border-contorno bg-fundo shadow-lg">
          {all.map((a) => (
            <li key={a.id}>
              <button
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-fundo-2"
                onClick={() => {
                  setOpen(false);
                  startTransition(() => switchAthlete(a.id));
                }}
              >
                <span className="text-tinta">{a.full_name}</span>
                {a.id === athlete.id && (
                  <Check size={16} className="text-tinta" aria-hidden />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
