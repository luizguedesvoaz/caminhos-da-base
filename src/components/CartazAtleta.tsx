"use client";

import { useState, useTransition } from "react";
import { Check, ChevronDown, Coins } from "lucide-react";
import { switchAthlete } from "@/app/(app)/actions";
import { Insignia } from "@/components/Divisa";
import type { AthleteRow } from "@/lib/athlete";

/**
 * O cartaz do Início.
 *
 * A tela abre com o atleta, não com um menu: a pergunta que traz a família aqui
 * é "como está meu filho", e o desenho responde antes de pedir qualquer coisa.
 *
 * A foto vertical ainda não existe no cadastro — enquanto ela não chega, o
 * lugar dela fica marcado com a hachura e a insígnia do degrau ocupa o espaço.
 * Não é enfeite: é o mesmo desenho do ícone que a pessoa tem na tela do celular.
 */
export function CartazAtleta({
  athlete,
  all,
  chip,
  clube,
  moedas,
  degrau,
}: {
  athlete: AthleteRow;
  all: AthleteRow[];
  /** "Sub-13 · 1º ano" */
  chip: string;
  clube: string | null;
  moedas: number;
  degrau: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const firstName = athlete.full_name.split(" ")[0];
  const varios = all.length > 1;

  return (
    <header className="relative">
      <div className="relative h-[210px] overflow-hidden rounded-[var(--radius-bloco)] border-2 border-contorno bg-fundo-2">
        {/* Marca d'água: as iniciais no lugar do número da camisa, que ainda
            não é um campo do cadastro. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-2 top-0 font-display text-[150px] font-extrabold leading-none tracking-[-.06em] text-acento opacity-[.30] dark:opacity-[.13]"
        >
          {firstName.slice(0, 2).toUpperCase()}
        </span>

        <span
          aria-hidden
          className="absolute inset-0 opacity-[.16] dark:opacity-[.10]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-45deg, currentColor 0 2px, transparent 2px 11px)",
          }}
        />

        {/* Degradê para o fundo da tela: o cartaz não termina numa linha, ele
            se dissolve no conteúdo. */}
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-2/3"
          style={{
            backgroundImage:
              "linear-gradient(to top, var(--fundo) 8%, transparent 100%)",
          }}
        />

        <div className="absolute inset-x-4 bottom-4 flex items-end gap-3">
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-contorno bg-fundo px-3 py-1 text-xs font-bold text-tinta">
              <Insignia degrau={degrau} tamanho={13} />
              {chip}
            </span>

            {varios ? (
              <button
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                disabled={pending}
                className="mt-2 flex items-center gap-1.5 text-left"
              >
                <span className="font-display text-[40px] font-extrabold leading-none tracking-[-.04em] text-tinta">
                  Fala, {firstName}
                </span>
                <ChevronDown
                  size={22}
                  className={`shrink-0 text-tinta-2 transition-transform ${open ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
            ) : (
              <h1 className="mt-2 font-display text-[40px] font-extrabold leading-none tracking-[-.04em] text-tinta">
                Fala, {firstName}
              </h1>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <p className="min-w-0 flex-1 truncate text-sm text-tinta-2">
          {clube ?? "Clube não informado"}
        </p>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 border-contorno px-3 py-1 text-xs font-bold text-tinta">
          <Coins size={14} strokeWidth={2.2} className="text-acento-texto" aria-hidden />
          <span className="tabular">{moedas}</span>
          <span className="sr-only">moedas</span>
        </span>
      </div>

      {open && (
        <ul className="absolute left-0 top-[190px] z-30 w-64 overflow-hidden rounded-[var(--radius-linha)] border-2 border-contorno bg-fundo shadow-[var(--sombra-bloco)]">
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
                  <Check size={16} className="text-acento-texto" aria-hidden />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
