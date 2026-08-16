"use client";

import { useState, useTransition } from "react";
import { Trash2, FileText, ExternalLink } from "lucide-react";
import { deleteDocument, getSignedUrl } from "@/app/(app)/documentos/actions";
import { documentStatus, STATUS_STYLE } from "@/lib/domain/documents";

export function DocumentRow({
  id,
  title,
  expiresOn,
  storagePath,
}: {
  id: string;
  title: string;
  expiresOn: string | null;
  storagePath: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [opening, setOpening] = useState(false);
  const { status, days } = documentStatus(expiresOn);
  const style = STATUS_STYLE[status];

  async function open() {
    if (!storagePath) return;
    setOpening(true);
    const url = await getSignedUrl(storagePath);
    setOpening(false);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <li
      className={`rounded-xl border border-line bg-white p-3.5 ${
        pending ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-ink">{title}</p>
          {/* O estado vem sempre escrito, nunca só pela cor. */}
          <span
            className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${style.className}`}
          >
            {style.label(days)}
          </span>
        </div>

        {storagePath && (
          <button
            onClick={open}
            disabled={opening}
            aria-label={`Abrir ${title}`}
            className="shrink-0 rounded-lg bg-navy-50 p-2 text-navy-900"
          >
            {opening ? (
              <FileText size={16} aria-hidden />
            ) : (
              <ExternalLink size={16} aria-hidden />
            )}
          </button>
        )}

        <button
          onClick={() =>
            startTransition(() => deleteDocument(id, storagePath))
          }
          aria-label={`Excluir ${title}`}
          className="shrink-0 p-1 text-muted transition-colors hover:text-red-600"
        >
          <Trash2 size={16} aria-hidden />
        </button>
      </div>
    </li>
  );
}
