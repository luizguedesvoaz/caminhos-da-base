"use client";

import { useActionState, useState } from "react";
import { ShieldAlert, Plus, X } from "lucide-react";
import {
  saveRegistration,
  type RegistrationState,
} from "@/app/(app)/documentos/federation-actions";
import { Button, Card, ErrorMessage, Field, inputClass } from "@/components/ui";
import { documentStatus } from "@/lib/domain/documents";

type Registration = {
  id: string;
  federation: string;
  club_name: string;
  season_year: number;
  registered_on: string | null;
  transfer_window_ends_on: string | null;
};

/**
 * O vínculo federativo é a dor invisível da base.
 *
 * Quando o clube inscreve o atleta na federação, ele fica preso àquele clube
 * durante a temporada. Muitos pais só descobrem isso ao tentar trocar de clube
 * no meio do ano, com a janela de transferência já fechada. Registrar a
 * inscrição e avisar do prazo é, sozinho, um motivo para manter o app.
 */
export function FederationCard({
  athleteId,
  season,
  registrations,
}: {
  athleteId: string;
  season: number;
  registrations: Registration[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<RegistrationState, FormData>(
    saveRegistration,
    {},
  );

  const current = registrations.find((r) => r.season_year === season);
  const window = current?.transfer_window_ends_on
    ? documentStatus(current.transfer_window_ends_on)
    : null;

  return (
    <>
      <Card>
        <div className="flex items-start gap-3">
          <ShieldAlert size={20} className="mt-0.5 shrink-0 text-tinta" aria-hidden />
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-tinta">
              Vínculo federativo {season}
            </h2>

            {current ? (
              <>
                <p className="mt-1 text-sm text-tinta">
                  Inscrito pela {current.federation} pelo {current.club_name}.
                </p>
                {window && (
                  <p
                    className={`mt-2 rounded-lg px-3 py-2 text-sm ${
                      window.status === "vencido"
                        ? "bg-fundo-2 text-tinta"
                        : window.status === "vencendo"
                          ? "bg-amber-50 text-amber-900"
                          : "bg-emerald-50 text-emerald-800"
                    }`}
                  >
                    {window.status === "vencido"
                      ? "A janela de transferência desta temporada já fechou. Uma troca de clube agora depende de liberação do clube atual."
                      : window.status === "vencendo"
                        ? `A janela de transferência fecha em ${window.days} ${window.days === 1 ? "dia" : "dias"}. Depois disso, trocar de clube fica bem mais difícil.`
                        : `Janela de transferência aberta por mais ${window.days} dias.`}
                  </p>
                )}
                <p className="mt-2 text-xs leading-relaxed text-tinta-2">
                  A inscrição na federação vincula o atleta ao clube durante a
                  temporada. É o detalhe que mais pega famílias de surpresa.
                </p>
              </>
            ) : (
              <>
                <p className="mt-1 text-sm leading-relaxed text-tinta-2">
                  Seu atleta foi inscrito em alguma federação nesta temporada?
                  Registrar aqui garante o aviso antes de a janela de
                  transferência fechar.
                </p>
                <button
                  onClick={() => setOpen(true)}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-tinta underline"
                >
                  <Plus size={14} aria-hidden />
                  Registrar inscrição
                </button>
              </>
            )}
          </div>
        </div>
      </Card>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40">
          <div className="max-h-[88dvh] w-full overflow-y-auto rounded-t-2xl bg-fundo p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-tinta">
                Inscrição na federação
              </h2>
              <button onClick={() => setOpen(false)} aria-label="Fechar">
                <X size={22} className="text-tinta-2" aria-hidden />
              </button>
            </div>

            <form action={formAction} className="space-y-4">
              <input type="hidden" name="athleteId" value={athleteId} />
              <input type="hidden" name="seasonYear" value={season} />

              <Field label="Federação" hint="Ex: FPF, FMF, FGF">
                <input
                  name="federation"
                  required
                  placeholder="FPF"
                  className={inputClass}
                />
              </Field>

              <Field label="Clube que fez a inscrição">
                <input name="clubName" required className={inputClass} />
              </Field>

              <Field label="Data da inscrição (opcional)">
                <input type="date" name="registeredOn" className={inputClass} />
              </Field>

              <Field
                label="Janela de transferência fecha em (opcional)"
                hint="Consulte no site da federação. O app avisa quando estiver perto."
              >
                <input type="date" name="windowEndsOn" className={inputClass} />
              </Field>

              <ErrorMessage>{state.error}</ErrorMessage>

              <Button type="submit" disabled={pending}>
                {pending ? "Salvando…" : "Salvar inscrição"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
