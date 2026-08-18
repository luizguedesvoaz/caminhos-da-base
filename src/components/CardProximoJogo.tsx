import Link from "next/link";

/**
 * O card do próximo jogo — o ÚNICO elemento em ouro da tela.
 *
 * O ouro (#FFC72C) é reservado a dia de jogo nos dois temas. Usá-lo como
 * destaque genérico esvazia a regra: se tudo é ouro, ouro não quer dizer nada.
 * Sempre que aparecer essa cor no app, é partida.
 */
export function CardProximoJogo({
  titulo,
  quando,
  faltam,
  href = "/tarefas",
}: {
  /** Adversário, ou o nome da tarefa de jogo quando não há adversário. */
  titulo: string;
  /** "sábado 22/08" — já formatado, para a tela não fazer conta. */
  quando: string;
  /** Dias que faltam. 0 = hoje. */
  faltam: number;
  href?: string;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="mt-5 flex items-center gap-4 rounded-[var(--radius-bloco)] border-2 border-jogo bg-jogo p-4 shadow-[var(--sombra-heroi)]"
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-jogo-tinta-2">
          Próximo jogo · {quando}
        </p>
        <p className="mt-1.5 truncate font-display text-[28px] font-extrabold leading-none tracking-[-.03em] text-jogo-tinta">
          {titulo}
        </p>
      </div>
      <p className="shrink-0 font-display text-[34px] font-extrabold leading-none tracking-[-.04em] tabular text-jogo-tinta">
        {faltam === 0 ? "hoje" : `${faltam}d`}
      </p>
    </Link>
  );
}
