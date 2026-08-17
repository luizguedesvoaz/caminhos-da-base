"use client";

import { useState, useTransition } from "react";
import { Copy, Check, UserPlus } from "lucide-react";
import { createReferralCode } from "@/app/(app)/conquistas/actions";
import { Button, Card, ErrorMessage } from "@/components/ui";

/**
 * Indicação: o usuário gera um código de convite e compartilha.
 *
 * O crédito é pago quando o código é usado, uma única vez por código —
 * garantido no banco pelo índice de idempotência do extrato, não por
 * verificação aqui.
 */
export function ReferralCard({ accepted }: { accepted: number }) {
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function generate() {
    setError(null);
    startTransition(async () => {
      const result = await createReferralCode();
      if (result.error) setError(result.error);
      else setCode(result.code ?? null);
    });
  }

  async function copy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Alguns navegadores de celular bloqueiam a área de transferência.
      // O código está visível na tela, então dá para copiar à mão.
      setError("Não foi possível copiar. Anote o código da tela.");
    }
  }

  return (
    <Card>
      <div className="flex items-start gap-3">
        <UserPlus size={20} className="mt-0.5 shrink-0 text-navy-900" aria-hidden />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-navy-900">Indicar outra família</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Gere um código de convite e envie para outro pai ou mãe. Quando a
            pessoa criar a conta, você recebe 300 moedas.
          </p>

          {accepted > 0 && (
            <p className="mt-2 text-sm font-medium text-emerald-700">
              {accepted}{" "}
              {accepted === 1 ? "indicação aceita" : "indicações aceitas"}
            </p>
          )}

          {code && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-navy-50 p-3">
              <span className="flex-1 font-mono text-base font-bold tracking-wider text-navy-900">
                {code}
              </span>
              <button
                onClick={copy}
                aria-label="Copiar código"
                className="shrink-0 rounded-lg bg-white p-2 text-navy-900"
              >
                {copied ? (
                  <Check size={16} aria-hidden />
                ) : (
                  <Copy size={16} aria-hidden />
                )}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-3">
              <ErrorMessage>{error}</ErrorMessage>
            </div>
          )}

          <div className="mt-3">
            <Button variant="ghost" disabled={pending} onClick={generate}>
              {pending ? "Gerando…" : code ? "Gerar outro código" : "Gerar código"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
