"use client";

import { useState, useTransition } from "react";
import { Gift, Ticket, UserCheck } from "lucide-react";
import { redeemReward, type RedeemResult } from "@/app/(app)/conquistas/actions";
import { Button, ErrorMessage } from "@/components/ui";
import { formatCoins } from "@/lib/domain/achievements";

type Reward = {
  id: string;
  title: string;
  description: string | null;
  cost_coins: number;
  kind: string;
  monthly_limit: number | null;
};

const KIND_ICON: Record<string, typeof Gift> = {
  cupom_parceiro: Ticket,
  desconto_assinatura: Gift,
  sessao_consultoria: UserCheck,
};

export function RewardList({
  rewards,
  balance,
}: {
  rewards: Reward[];
  balance: number;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<RedeemResult | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function handleRedeem(id: string) {
    setBusyId(id);
    setResult(null);
    startTransition(async () => {
      const outcome = await redeemReward(id);
      setResult(outcome);
      setBusyId(null);
    });
  }

  return (
    <>
      {result?.ok && (
        <div className="mb-3 rounded-xl bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-900">
            {result.title} resgatado
          </p>
          <p className="mt-1 font-mono text-lg font-bold tracking-wider text-emerald-900">
            {result.code}
          </p>
          <p className="mt-1 text-xs text-emerald-800">
            Guarde este código. Ele também fica na lista de resgates abaixo.
          </p>
        </div>
      )}

      {result && !result.ok && (
        <div className="mb-3">
          <ErrorMessage>{result.error}</ErrorMessage>
        </div>
      )}

      <ul className="space-y-2">
        {rewards.map((reward) => {
          const Icon = KIND_ICON[reward.kind] ?? Gift;
          const affordable = balance >= reward.cost_coins;
          const missing = reward.cost_coins - balance;

          return (
            <li
              key={reward.id}
              className="rounded-xl border border-line bg-white p-3.5"
            >
              <div className="flex items-start gap-3">
                <Icon
                  size={20}
                  className="mt-0.5 shrink-0 text-navy-900"
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">
                    {reward.title}
                  </p>
                  {reward.description && (
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">
                      {reward.description}
                    </p>
                  )}
                  <p className="mt-1.5 text-sm font-semibold tabular-nums text-navy-900">
                    {formatCoins(reward.cost_coins)} moedas
                  </p>
                  {reward.monthly_limit !== null && (
                    <p className="mt-0.5 text-xs text-muted">
                      {reward.monthly_limit} vagas por mês
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3">
                {affordable ? (
                  <Button
                    variant="gold"
                    disabled={pending}
                    onClick={() => handleRedeem(reward.id)}
                  >
                    {busyId === reward.id ? "Resgatando…" : "Resgatar"}
                  </Button>
                ) : (
                  <p className="rounded-xl bg-navy-50 px-4 py-3 text-center text-sm text-muted">
                    Faltam {formatCoins(missing)} moedas
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {rewards.length === 0 && (
        <p className="rounded-xl border border-line bg-white p-5 text-sm text-muted">
          Nenhuma recompensa disponível agora.
        </p>
      )}
    </>
  );
}
