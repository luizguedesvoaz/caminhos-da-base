"use client";

import { useState, useTransition } from "react";
import { Trash2, Play, ChevronDown } from "lucide-react";
import { deleteMatch } from "@/app/(app)/temporada/actions";
import { youtubeId, type Match } from "@/lib/domain/season";

export function MatchRow({ match }: { match: Match }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [y, m, d] = match.played_on.split("-");
  const videoId = match.video_url ? youtubeId(match.video_url) : null;

  const stats = [
    match.minutes_played !== null && `${match.minutes_played} min`,
    match.goals > 0 && `${match.goals} ${match.goals === 1 ? "gol" : "gols"}`,
    match.assists > 0 &&
      `${match.assists} ${match.assists === 1 ? "assistência" : "assistências"}`,
  ].filter(Boolean) as string[];

  return (
    <li
      className={`overflow-hidden rounded-xl border border-line bg-white ${
        pending ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start gap-3 p-3.5">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-ink">
            {match.opponent ? `vs ${match.opponent}` : "Jogo"}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {d}/{m}/{y}
            {match.competition_name && ` · ${match.competition_name}`}
          </p>
          {stats.length > 0 && (
            <p className="mt-1.5 text-xs font-medium tabular-nums text-navy-900">
              {stats.join(" · ")}
            </p>
          )}
        </div>

        {match.video_url && (
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Ver vídeo do jogo"
            className="shrink-0 rounded-lg bg-navy-50 p-2 text-navy-900"
          >
            {videoId ? (
              <Play size={16} aria-hidden />
            ) : (
              <ChevronDown size={16} aria-hidden />
            )}
          </button>
        )}

        <button
          onClick={() => startTransition(() => deleteMatch(match.id))}
          aria-label="Excluir jogo"
          className="shrink-0 p-1 text-muted transition-colors hover:text-red-600"
        >
          <Trash2 size={16} aria-hidden />
        </button>
      </div>

      {open && match.video_url && (
        <div className="border-t border-line p-3.5">
          {videoId ? (
            <div className="aspect-video overflow-hidden rounded-lg bg-black">
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
              className="break-all text-sm text-navy-900 underline"
            >
              {match.video_url}
            </a>
          )}
          {match.notes && (
            <p className="mt-3 text-sm leading-relaxed text-muted">{match.notes}</p>
          )}
        </div>
      )}
    </li>
  );
}
