import { STEPS, type Step } from "@/lib/domain/pyramid";

/**
 * A pirâmide de 3 níveis — elemento visual mais forte do produto.
 * O degrau atual acende em dourado; os demais ficam apagados.
 */
export function Pyramid({
  step,
  size = "large",
}: {
  step: Step;
  size?: "large" | "small";
}) {
  const levels: { level: Step; width: string }[] = [
    { level: 3, width: "42%" },
    { level: 2, width: "70%" },
    { level: 1, width: "100%" },
  ];

  const height = size === "large" ? "h-14" : "h-8";
  const gap = size === "large" ? "gap-1.5" : "gap-1";

  return (
    <div
      className={`flex w-full flex-col items-center ${gap}`}
      role="img"
      aria-label={`Degrau ${step} de 3: ${STEPS[step].name}`}
    >
      {levels.map(({ level, width }, index) => {
        const active = level === step;
        return (
          <div
            key={level}
            style={{ width, animationDelay: `${index * 90}ms` }}
            className={[
              height,
              "animate-rise flex items-center justify-center rounded-md transition-colors",
              active
                ? "bg-gold-500 text-navy-900 shadow-lg shadow-gold-500/30"
                : "bg-navy-900/15 text-navy-900/50",
            ].join(" ")}
          >
            {size === "large" && (
              <span className="px-2 text-center text-xs font-semibold leading-tight">
                {STEPS[level].name}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
