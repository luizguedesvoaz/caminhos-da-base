"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { UserPlus, Clock, Check, X } from "lucide-react";
import {
  submitReferralRequest,
  type ReferralState,
} from "@/app/(app)/conquistas/actions";
import { Button, Card, ErrorMessage, Field, inputClass } from "@/components/ui";

export type ReferralRequest = {
  id: string;
  family_name: string;
  phone: string;
  status: string;
  created_at: string;
};

const STATUS_LABEL: Record<
  string,
  { text: string; className: string; Icon: typeof Clock }
> = {
  pendente: {
    text: "Aguardando o consultor",
    className: "bg-amber-50 text-amber-900",
    Icon: Clock,
  },
  aprovada: {
    text: "Aprovada — consultor vai entrar em contato",
    className: "bg-fundo-2 text-tinta",
    Icon: Check,
  },
  convertida: {
    text: "Família entrou — 300 moedas creditadas",
    className: "bg-emerald-50 text-emerald-800",
    Icon: Check,
  },
  recusada: {
    text: "Não aprovada",
    className: "bg-red-50 text-red-800",
    Icon: X,
  },
};

/** Mostra só os últimos dígitos: o telefone completo não precisa ficar exposto. */
function maskPhone(digits: string): string {
  if (digits.length < 4) return "•••";
  return `••••• ${digits.slice(-4)}`;
}

/**
 * Indicação por solicitação, não por código automático.
 *
 * A família envia os dados de contato e o consultor decide se aprova e envia o
 * convite. Isso mantém o controle de quem entra no app — essencial se o produto
 * passar a ser pago — e as moedas só são pagas quando a família indicada
 * realmente cria a conta.
 */
export function ReferralCard({
  requests,
}: {
  requests: ReferralRequest[];
}) {
  const [open, setOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const [state, formAction, pending] = useActionState<ReferralState, FormData>(
    submitReferralRequest,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setConsent(false);
      setOpen(false);
    }
  }, [state.ok]);

  const converted = requests.filter((r) => r.status === "convertida").length;

  return (
    <Card>
      <div className="flex items-start gap-3">
        <UserPlus size={20} className="mt-0.5 shrink-0 text-tinta" aria-hidden />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-tinta">Indicar outra família</h3>
          <p className="mt-1 text-sm leading-relaxed text-tinta-2">
            Conhece uma família que se beneficiaria do app? Envie o contato que o
            consultor fala com ela e envia o convite. Quando a família entrar,
            você recebe 300 moedas.
          </p>

          {converted > 0 && (
            <p className="mt-2 text-sm font-medium text-emerald-700">
              {converted}{" "}
              {converted === 1
                ? "indicação já entrou"
                : "indicações já entraram"}
            </p>
          )}

          {requests.length > 0 && (
            <ul className="mt-3 space-y-2">
              {requests.map((request) => {
                const meta = STATUS_LABEL[request.status] ?? STATUS_LABEL.pendente;
                return (
                  <li key={request.id} className="rounded-lg border border-contorno p-3">
                    <p className="text-sm font-medium text-tinta">
                      {request.family_name}
                    </p>
                    <p className="text-xs text-tinta-2">{maskPhone(request.phone)}</p>
                    <span
                      className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.className}`}
                    >
                      <meta.Icon size={12} aria-hidden />
                      {meta.text}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          {!open ? (
            <div className="mt-3">
              <Button variant="ghost" onClick={() => setOpen(true)}>
                Indicar uma família
              </Button>
            </div>
          ) : (
            <form ref={formRef} action={formAction} className="mt-4 space-y-3">
              <Field label="Nome da família ou do responsável">
                <input
                  name="familyName"
                  required
                  placeholder="Ex: Ana Paula, mãe do Lucas"
                  className={inputClass}
                />
              </Field>

              <Field label="Telefone com DDD">
                <input
                  name="phone"
                  required
                  inputMode="tel"
                  placeholder="11 91234-5678"
                  className={inputClass}
                />
              </Field>

              <Field label="Nome do atleta (opcional)">
                <input name="athleteName" className={inputClass} />
              </Field>

              <Field label="Algo que ajude o consultor (opcional)">
                <input
                  name="note"
                  placeholder="Ex: joga no mesmo time, categoria sub-11"
                  className={inputClass}
                />
              </Field>

              {/* Exigência de LGPD: o telefone é dado de terceiro. Sem esta
                  confirmação a solicitação é recusada pelo próprio banco. */}
              <label className="flex items-start gap-3 rounded-xl bg-fundo-2 p-3.5">
                <input
                  type="checkbox"
                  name="consent"
                  value="1"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 size-5 shrink-0 accent-acento"
                />
                <span className="text-sm leading-relaxed text-tinta">
                  Confirmo que avisei essa família e que ela autorizou o contato
                  do consultor.
                </span>
              </label>

              <ErrorMessage>{state.error}</ErrorMessage>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={pending || !consent}>
                  {pending ? "Enviando…" : "Enviar indicação"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Card>
  );
}
