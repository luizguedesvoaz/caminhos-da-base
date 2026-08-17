"use client";

import { useState, useTransition } from "react";
import { PauseCircle, PlayCircle } from "lucide-react";
import { toggleAccountBlock } from "@/app/painel/actions";
import { Button, ErrorMessage, inputClass } from "@/components/ui";

/**
 * Pausar ou reativar o acesso de uma família.
 *
 * Pausar NÃO apaga nada: histórico, tarefas, gastos e temporadas continuam
 * intactos, e voltam a aparecer quando a conta é reativada. É a ferramenta
 * certa para quem parou de pagar ou saiu da consultoria — apagar seria
 * destruir o acervo que a família construiu, e que é o principal motivo dela
 * voltar depois.
 */
export function AccountToggle({
  userId,
  blocked,
  name,
}: {
  userId: string;
  blocked: boolean;
  name: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function apply(nextBlocked: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await toggleAccountBlock(userId, nextBlocked, reason);
      if (!result.ok) setError(result.error ?? "Falhou.");
      setConfirming(false);
      setReason("");
    });
  }

  if (blocked) {
    return (
      <>
        <p className="mb-2 text-sm text-muted">
          O acesso desta família está pausado. Os dados seguem guardados.
        </p>
        <ErrorMessage>{error}</ErrorMessage>
        <Button variant="ghost" disabled={pending} onClick={() => apply(false)}>
          <PlayCircle size={16} className="mr-1.5" aria-hidden />
          {pending ? "Reativando…" : "Reativar acesso"}
        </Button>
      </>
    );
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 text-sm text-muted underline"
      >
        <PauseCircle size={15} aria-hidden />
        Pausar acesso desta família
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-ink">
        Pausar o acesso de {name}? Ela não conseguirá entrar no app, mas nada é
        apagado.
      </p>
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Motivo (ex: assinatura vencida)"
        className={inputClass}
      />
      <ErrorMessage>{error}</ErrorMessage>
      <div className="flex gap-2">
        <Button variant="ghost" onClick={() => setConfirming(false)}>
          Cancelar
        </Button>
        <Button disabled={pending} onClick={() => apply(true)}>
          {pending ? "Pausando…" : "Confirmar pausa"}
        </Button>
      </div>
    </div>
  );
}
