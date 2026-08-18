import Link from "next/link";
import { AlertTriangle, ChevronRight, FileWarning, ShieldAlert } from "lucide-react";

export type Alert = {
  key: string;
  href: string;
  text: string;
  tone: "urgent" | "warning";
  icon: "task" | "document" | "federation";
};

const ICONS = {
  task: AlertTriangle,
  document: FileWarning,
  federation: ShieldAlert,
};

/**
 * Alertas do dashboard. Estado nunca é comunicado só por cor — cada linha traz
 * ícone e texto explícito.
 *
 * Nenhum alerta usa ouro, nem o de documento vencendo: no desenho novo o ouro
 * é exclusivo de dia de jogo. Prazo apertado usa o âmbar de aviso, que é mais
 * fechado e não se confunde com partida.
 */
export function AlertsCard({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return null;

  return (
    <ul className="mt-5 space-y-2.5">
      {alerts.map((alert) => {
        const Icon = ICONS[alert.icon];
        const urgent = alert.tone === "urgent";
        return (
          <li key={alert.key}>
            <Link
              href={alert.href}
              prefetch={false}
              className={`flex items-center gap-3 rounded-[var(--radius-linha)] border-2 p-3.5 ${
                urgent
                  ? "border-alerta bg-alerta-fundo"
                  : "border-aviso bg-aviso-fundo"
              }`}
            >
              <Icon
                size={20}
                strokeWidth={2.2}
                className={`shrink-0 ${urgent ? "text-alerta" : "text-aviso"}`}
                aria-hidden
              />
              <p
                className={`flex-1 text-[14px] font-medium leading-snug ${
                  urgent ? "text-alerta-tinta" : "text-aviso-tinta"
                }`}
              >
                {alert.text}
              </p>
              <ChevronRight
                size={18}
                className={urgent ? "text-alerta" : "text-aviso"}
                aria-hidden
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
