import { Check, Swords, X } from "lucide-react";
import { WEEK_INITIALS } from "@/lib/domain/tasks";

export type DiaSemana =
  | "cumprido"
  | "falhou"
  | "hoje"
  | "jogo"
  | "futuro"
  | "vazio";

/**
 * A cartela da semana: sete quadradinhos que cabem num olhar.
 *
 * É o único lugar do app onde a família vê a semana inteira de uma vez, e é
 * de propósito que ela não vira gráfico — quadrado cheio ou vazio é o que
 * uma criança de 9 anos entende sem explicação.
 *
 * Dia de jogo é ouro. É a regra do desenho: ouro só significa partida.
 */
export function CartelaSemana({
  dias,
  progresso,
}: {
  dias: { estado: DiaSemana; rotulo: string }[];
  /** 0 a 1 — fração da semana já cumprida. */
  progresso: number;
}) {
  return (
    <div>
      <div
        className="h-3.5 w-full overflow-hidden rounded-full border-2 border-contorno"
        role="progressbar"
        aria-valuenow={Math.round(progresso * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso da semana"
      >
        <div
          className="h-full bg-acento transition-[width] duration-300"
          style={{ width: `${Math.max(0, Math.min(1, progresso)) * 100}%` }}
        />
      </div>

      <ul className="mt-3 grid grid-cols-7 gap-1.5">
        {dias.map((dia, i) => (
          <li key={i} className="flex flex-col items-center gap-1">
            <span
              className={`flex size-8 items-center justify-center rounded-[var(--radius-caixa)] border-2 ${
                ESTADOS[dia.estado].caixa
              }`}
              title={dia.rotulo}
            >
              {ESTADOS[dia.estado].icone}
              <span className="sr-only">{dia.rotulo}</span>
            </span>
            <span className="text-[11px] font-bold text-tinta-2">
              {WEEK_INITIALS[i]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const ESTADOS: Record<DiaSemana, { caixa: string; icone: React.ReactNode }> = {
  cumprido: {
    caixa: "border-acento bg-acento text-acento-tinta",
    icone: <Check size={16} strokeWidth={3} aria-hidden />,
  },
  falhou: {
    caixa: "border-alerta bg-alerta-fundo text-alerta",
    icone: <X size={14} strokeWidth={3} aria-hidden />,
  },
  hoje: {
    caixa: "border-contorno-forte bg-transparent",
    icone: <span aria-hidden className="size-1.5 rounded-full bg-contorno-forte" />,
  },
  jogo: {
    caixa: "border-jogo bg-jogo text-jogo-tinta",
    icone: <Swords size={15} strokeWidth={2.4} aria-hidden />,
  },
  futuro: {
    caixa: "border-contorno bg-transparent",
    icone: null,
  },
  vazio: {
    caixa: "border-contorno bg-transparent opacity-45",
    icone: null,
  },
};
