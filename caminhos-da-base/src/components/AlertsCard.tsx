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
 */
export function AlertsCard({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return null;

  return (
    <ul className="mb-4 space-y-2">
      {alerts.map((alert) => {
        const Icon = ICONS[alert.icon];
        const urgent = alert.tone === "urgent";
        return (
          <li key={alert.key}>
            <Link
              href={alert.href}
              className={`flex items-center gap-3 rounded-xl p-4 ${
                urgent ? "bg-red-50" : "bg-amber-50"
              }`}
            >
              <Icon
                size={20}
                className={`shrink-0 ${urgent ? "text-red-700" : "text-amber-800"}`}
                aria-hidden
              />
              <p
                className={`flex-1 text-sm ${
                  urgent ? "text-red-800" : "text-amber-900"
                }`}
              >
                {alert.text}
              </p>
              <ChevronRight
                size={18}
                className={urgent ? "text-red-700" : "text-amber-800"}
                aria-hidden
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
