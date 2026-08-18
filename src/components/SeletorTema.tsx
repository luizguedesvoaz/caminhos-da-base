"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { TEMA_COOKIE, TEMA_MAX_AGE, type Tema } from "@/lib/tema";

/**
 * Seletor de tema, para a tela de Perfil.
 *
 * Troca instantânea: escreve data-tema no <html> e grava o cookie, que é o que
 * o servidor lê na próxima navegação. Nenhum recarregamento, nenhum flash.
 */
export function SeletorTema({ inicial }: { inicial: Tema }) {
  const [tema, setTema] = useState<Tema>(inicial);

  function escolher(proximo: Tema) {
    document.documentElement.dataset.tema = proximo;
    document.cookie = `${TEMA_COOKIE}=${proximo};path=/;max-age=${TEMA_MAX_AGE};samesite=lax`;
    setTema(proximo);
  }

  const opcoes: { valor: Tema; rotulo: string; Icone: typeof Sun }[] = [
    { valor: "claro", rotulo: "Claro", Icone: Sun },
    { valor: "escuro", rotulo: "Escuro", Icone: Moon },
  ];

  return (
    <fieldset className="border-0 p-0">
      <legend className="mb-2 text-xs font-bold uppercase tracking-[.14em] text-tinta-2">
        Aparência
      </legend>
      <div
        role="radiogroup"
        aria-label="Tema do aplicativo"
        className="inline-flex gap-1.5 rounded-full border-2 border-contorno bg-fundo p-1.5"
      >
        {opcoes.map(({ valor, rotulo, Icone }) => {
          const ativo = tema === valor;
          return (
            <button
              key={valor}
              type="button"
              role="radio"
              aria-checked={ativo}
              onClick={() => escolher(valor)}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[15px] font-bold transition-colors ${
                ativo
                  ? "bg-acento text-acento-tinta"
                  : "text-tinta-2 hover:text-tinta"
              }`}
            >
              <Icone size={17} strokeWidth={2.2} aria-hidden />
              {rotulo}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-sm text-tinta-2">
        O claro é o padrão. Sua escolha vale para este aparelho.
      </p>
    </fieldset>
  );
}
