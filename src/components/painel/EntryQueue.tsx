"use client";

import { useState, useTransition } from "react";
import { MessageCircle, Copy, Check, UserPlus, Globe } from "lucide-react";
import { approveEntry, rejectEntry, type ApproveResult } from "@/app/painel/actions";
import { Button, ErrorMessage, inputClass } from "@/components/ui";
import type { EntryQueueItem } from "@/lib/consultant";

/** Telefone brasileiro legível: (11) 91234-5678 */
function formatPhone(digits: string): string {
  const d = digits.startsWith("55") && digits.length > 11 ? digits.slice(2) : digits;
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digits;
}

function whatsappLink(digits: string, message: string): string {
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}

export function EntryQueue({
  items,
  readOnly = false,
}: {
  items: EntryQueueItem[];
  readOnly?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [results, setResults] = useState<Record<string, ApproveResult>>({});
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function approve(item: EntryQueueItem) {
    setError(null);
    startTransition(async () => {
      const result = await approveEntry(item.kind, item.id);
      if (!result.ok) setError(result.error ?? "Falhou.");
      else setResults((prev) => ({ ...prev, [item.id]: result }));
    });
  }

  function reject(item: EntryQueueItem) {
    setError(null);
    startTransition(async () => {
      const result = await rejectEntry(item.kind, item.id, reason);
      if (!result.ok) setError(result.error ?? "Falhou.");
      setRejecting(null);
      setReason("");
    });
  }

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("Não foi possível copiar. O código está visível na tela.");
    }
  }

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-line bg-white p-5 text-sm text-muted">
        Nada por aqui.
      </p>
    );
  }

  return (
    <>
      <ErrorMessage>{error}</ErrorMessage>

      <ul className="mt-2 space-y-2">
        {items.map((item) => {
          const fresh = results[item.id];
          const code = fresh?.code ?? item.invite_code;
          const message = `Olá${item.name ? `, ${item.name.split(" ")[0]}` : ""}! Aqui é do Caminhos da Base. Seu código de acesso é ${code}. Baixe o app e use esse código para criar sua conta.`;

          return (
            <li
              key={`${item.kind}-${item.id}`}
              className="rounded-xl border border-line bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">{item.name}</p>
                    <span
                      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.kind === "indicacao"
                          ? "bg-navy-50 text-navy-900"
                          : "bg-gold-500/15 text-gold-600"
                      }`}
                    >
                      {item.kind === "indicacao" ? (
                        <>
                          <UserPlus size={11} aria-hidden />
                          Indicação
                        </>
                      ) : (
                        <>
                          <Globe size={11} aria-hidden />
                          Pediu na página
                        </>
                      )}
                    </span>
                    {item.status !== "pendente" && (
                      <span className="rounded-full bg-navy-900/8 px-2 py-0.5 text-xs text-muted">
                        {item.status}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm tabular-nums text-ink">
                    {formatPhone(item.phone)}
                    {item.email && ` · ${item.email}`}
                  </p>

                  {item.athlete_name && (
                    <p className="mt-0.5 text-sm text-muted">
                      Atleta: {item.athlete_name}
                    </p>
                  )}
                  {item.detail && (
                    <p className="mt-0.5 text-xs text-muted">{item.detail}</p>
                  )}
                  {item.referrer_name && (
                    <p className="mt-0.5 text-xs text-muted">
                      Indicado por {item.referrer_name} — ganha 300 moedas se a
                      família entrar
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted">
                    {new Date(item.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>

              {code && (
                <div className="mt-3 rounded-xl bg-emerald-50 p-3">
                  <p className="text-xs text-emerald-800">Código gerado</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-base font-bold tracking-wider text-emerald-900">
                      {code}
                    </span>
                    <button
                      onClick={() => copy(code)}
                      aria-label="Copiar código"
                      className="rounded-lg bg-white p-1.5 text-emerald-900"
                    >
                      {copied === code ? (
                        <Check size={14} aria-hidden />
                      ) : (
                        <Copy size={14} aria-hidden />
                      )}
                    </button>
                    <a
                      href={whatsappLink(item.phone, message)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      <MessageCircle size={13} aria-hidden />
                      Abrir WhatsApp
                    </a>
                  </div>
                  <p className="mt-1.5 text-xs text-emerald-800">
                    O WhatsApp abre com a mensagem pronta. Confira antes de
                    enviar.
                  </p>
                </div>
              )}

              {!readOnly && item.status === "pendente" && (
                <div className="mt-3">
                  {rejecting === item.id ? (
                    <div className="space-y-2">
                      <input
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Motivo da recusa (fica registrado)"
                        className={inputClass}
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setRejecting(null);
                            setReason("");
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button disabled={pending} onClick={() => reject(item)}>
                          Confirmar recusa
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <button
                        disabled={pending}
                        onClick={() => approve(item)}
                        className="rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {pending ? "Aprovando…" : "Aprovar e gerar código"}
                      </button>
                      <button
                        onClick={() => setRejecting(item.id)}
                        className="rounded-xl border border-line px-4 py-2.5 text-sm text-muted"
                      >
                        Recusar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
