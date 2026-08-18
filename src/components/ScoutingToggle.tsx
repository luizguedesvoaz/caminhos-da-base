"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { setScoutingVisible } from "@/app/(app)/perfil/actions";
import { Card, ErrorMessage } from "@/components/ui";

/**
 * Controle da família sobre a vitrine.
 *
 * O modelo é opt-out: o atleta entra visível e a família sai quando quiser.
 * Por isso este card é EXPLÍCITO e fica no perfil, não escondido numa
 * política que ninguém lê — num arranjo opt-out, a clareza do aviso é o que
 * sustenta a escolha.
 *
 * O texto diz o que é compartilhado e, principalmente, o que NÃO é.
 */
export function ScoutingToggle({
  athleteId,
  visible,
  athleteName,
}: {
  athleteId: string;
  visible: boolean;
  athleteName: string;
}) {
  const [isVisible, setIsVisible] = useState(visible);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function apply(next: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await setScoutingVisible(athleteId, next);
      if (!result.ok) setError(result.error ?? "Não foi possível alterar.");
      else setIsVisible(next);
    });
  }

  return (
    <Card className="mt-4">
      <div className="flex items-start gap-3">
        {isVisible ? (
          <Eye size={20} className="mt-0.5 shrink-0 text-tinta" aria-hidden />
        ) : (
          <EyeOff size={20} className="mt-0.5 shrink-0 text-tinta-2" aria-hidden />
        )}

        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-tinta">
            Apresentação a clubes e parceiros
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-tinta-2">
            {isVisible ? (
              <>
                O perfil esportivo de {athleteName} pode ser apresentado a
                clubes, empresários e parceiros da consultoria.
              </>
            ) : (
              <>
                {athleteName} está fora dessas apresentações. Nada dele é
                mostrado a clubes ou parceiros.
              </>
            )}
          </p>

          <div className="mt-3 rounded-xl bg-fundo-2 p-3.5">
            <p className="text-xs font-semibold text-tinta">
              O que é mostrado
            </p>
            <p className="mt-1 text-xs leading-relaxed text-tinta">
              Nome, ano de nascimento, categoria, posição, clube e os números da
              temporada: minutos em campo, jogos, gols e assistências.
            </p>
            <p className="mt-2.5 text-xs font-semibold text-tinta">
              O que nunca é mostrado
            </p>
            <p className="mt-1 text-xs leading-relaxed text-tinta">
              Telefone, e-mail, endereço, documentos, gastos da família e
              qualquer observação de saúde.
            </p>
          </div>

          <ErrorMessage>{error}</ErrorMessage>

          <button
            onClick={() => apply(!isVisible)}
            disabled={pending}
            className={`mt-3 w-full rounded-xl px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-50 ${
              isVisible
                ? "border border-contorno bg-fundo text-tinta"
                : "bg-marinho-fundo text-white"
            }`}
          >
            {pending
              ? "Salvando…"
              : isVisible
                ? "Não quero mais aparecer"
                : "Quero voltar a aparecer"}
          </button>

          <p className="mt-2 text-xs text-tinta-2">
            Você pode mudar isso quando quiser, e vale a partir do momento em
            que salvar.
          </p>
        </div>
      </div>
    </Card>
  );
}
