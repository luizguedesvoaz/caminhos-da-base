import { STEPS, type Step } from "@/lib/domain/pyramid";

/**
 * A pirâmide de 3 níveis — elemento visual mais forte do produto.
 *
 * As lajes têm LARGURA IGUAL. A largura variável do desenho antigo saiu: com
 * três degraus só, o triângulo lia como "o topo é menor", quando a mensagem é
 * "o topo é mais alto". A hierarquia agora é altura + cor, que é o que a
 * pessoa realmente compara.
 */
export function Pyramid({
  step,
  tamanho = "comprimida",
  motivo,
}: {
  step: Step;
  /** `comprimida` é o bloco do Início; `revelacao` é a tela do resultado. */
  tamanho?: "comprimida" | "revelacao";
  /** Texto do porquê, exibido dentro da laje ativa na tela de revelação. */
  motivo?: string | null;
}) {
  const grande = tamanho === "revelacao";
  const alturaInativa = grande ? 54 : 13;
  const alturaAtiva = grande ? 88 : 30;

  const niveis: Step[] = [3, 2, 1];

  return (
    <div
      className="flex w-full flex-col gap-2"
      role="img"
      aria-label={`Degrau ${step} de 3: ${STEPS[step].name}`}
    >
      {niveis.map((nivel, index) => {
        const ativo = nivel === step;
        const concluido = nivel < step;

        return (
          <div
            key={nivel}
            style={{
              minHeight: ativo ? alturaAtiva : alturaInativa,
              animationDelay: `${index * 90}ms`,
              transform: ativo ? "rotate(-.6deg)" : undefined,
            }}
            className={[
              "animate-rise flex items-center rounded-[var(--radius-linha)] border-2 px-3",
              ativo
                ? "border-contorno bg-acento text-acento-tinta shadow-[var(--sombra-heroi)]"
                : concluido
                  ? "border-contorno bg-tinta/25 text-tinta"
                  : "border-contorno bg-transparent text-tinta-3",
              grande ? "py-2" : "",
            ].join(" ")}
          >
            {grande && (
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-[22px] font-extrabold leading-none tracking-[-.03em]">
                    {nivel}
                  </span>
                  <span className="text-[13px] font-bold">
                    {STEPS[nivel].name}
                  </span>
                </div>
                {ativo && motivo && (
                  <p className="mt-1 text-[13px] leading-snug text-acento-tinta/80">
                    {motivo}
                  </p>
                )}
              </div>
            )}

            {!grande && (
              <span className="sr-only">
                {nivel} — {STEPS[nivel].name}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
