"use client";

import { useState, useTransition } from "react";
import { Trash2, Play, ChevronDown } from "lucide-react";
import { deleteMatch } from "@/app/(app)/temporada/actions";
import { youtubeId, type Match } from "@/lib/domain/season";

/** A partir de 60 minutos o jogo já é "jogou de verdade" na base. */
const MUITO = 60;

export function MatchRow({ match }: { match: Match }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [y, m, d] = match.played_on.split("-");
  const videoId = match.video_url ? youtubeId(match.video_url) : null;
  const minutos = match.minutes_played ?? 0;

  /* A placa de minutos é a primeira coisa que se lê na linha — antes do
     adversário. É o desenho dizendo o que importa: não é contra quem jogou,
     é quanto jogou. */
  const placa =
    minutos === 0
      ? "border-alerta bg-alerta-fundo text-alerta"
      : minutos >= MUITO
        ? "border-contorno bg-acento text-acento-tinta"
        : "border-contorno bg-fundo-2 text-tinta";

  const chips = [
    match.goals > 0 && `${match.goals} ${match.goals === 1 ? "gol" : "gols"}`,
    match.assists > 0 &&
      `${match.assists} ${match.assists === 1 ? "assistência" : "assistências"}`,
  ].filter(Boolean) as string[];

  return (
    <li
      className={`overflow-hidden rounded-[var(--radius-card)] border-2 border-contorno bg-fundo ${
        pending ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-stretch gap-3 p-3">
        <div
          className={`flex w-[70px] shrink-0 flex-col items-center justify-center rounded-[var(--radius-linha)] border-2 py-2 ${placa}`}
        >
          <span className="font-display text-[26px] font-extrabold leading-none tracking-[-.03em] tabular">
            {minutos}
          </span>
          <span className="mt-0.5 text-[10px] font-bold uppercase tracking-[.14em]">
            {minutos === 0 ? "banco" : "min"}
          </span>
        </div>

        <div className="min-w-0 flex-1 self-center">
          <p className="truncate text-[16px] font-bold leading-snug text-tinta">
            {match.opponent ? `vs ${match.opponent}` : "Jogo"}
          </p>
          <p className="mt-0.5 truncate text-[13px] text-tinta-2">
            {d}/{m}/{y}
            {match.competition_name && ` · ${match.competition_name}`}
          </p>
          {chips.length > 0 && (
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {chips.map((chip) => (
                <li
                  key={chip}
                  className="rounded-full border-2 border-contorno px-2 py-0.5 text-[11px] font-bold tabular text-tinta"
                >
                  {chip}
                </li>
              ))}
            </ul>
          )}
        </div>

        {match.video_url && (
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Ver vídeo do jogo"
            className="flex w-[46px] shrink-0 items-center justify-center rounded-[var(--radius-linha)] border-2 border-contorno text-tinta"
          >
            {videoId ? (
              <Play size={17} strokeWidth={2.2} aria-hidden />
            ) : (
              <ChevronDown size={17} strokeWidth={2.2} aria-hidden />
            )}
          </button>
        )}

        <button
          onClick={() => startTransition(() => deleteMatch(match.id))}
          aria-label="Excluir jogo"
          className="shrink-0 self-start p-1 text-tinta-3 transition-colors hover:text-alerta"
        >
          <Trash2 size={16} aria-hidden />
        </button>
      </div>

      {open && match.video_url && (
        <div className="border-t-2 border-contorno p-3.5">
          {videoId ? (
            <div className="aspect-video overflow-hidden rounded-[var(--radius-linha)] bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                title={`Vídeo do jogo de ${d}/${m}/${y}`}
                allowFullScreen
                loading="lazy"
                className="size-full"
              />
            </div>
          ) : (
            <a
              href={match.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-sm text-tinta underline"
            >
              {match.video_url}
            </a>
          )}
          {match.notes && (
            <p className="mt-3 text-sm leading-relaxed text-tinta-2">{match.notes}</p>
          )}
        </div>
      )}
    </li>
  );
}
