/**
 * A divisa — o mesmo desenho do ícone do app, usado como progresso dentro dele.
 *
 * O ícone instalado no celular são três divisas empilhadas com a de cima acesa.
 * Aqui a insígnia repete isso com o degrau real do atleta: quem olha a tela de
 * início do telefone e quem abre o app veem a mesma figura.
 */
export function Divisa({
  tamanho = 24,
  className = "",
}: {
  tamanho?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 512 512"
      width={tamanho}
      height={tamanho}
      aria-hidden
      className={className}
    >
      <path
        d="M148 236 L256 128 L364 236"
        fill="none"
        stroke="currentColor"
        strokeWidth={46}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Insígnia do atleta: três divisas, de baixo para cima Iniciação, Competições
 * Intermediárias e Alto Rendimento. Acesas até o degrau atual.
 */
export function Insignia({
  degrau,
  tamanho = 22,
  animar = false,
  className = "",
}: {
  degrau: number;
  tamanho?: number;
  animar?: boolean;
  className?: string;
}) {
  // De cima para baixo na tela: degrau 3, 2, 1.
  const niveis = [3, 2, 1];

  return (
    <span
      role="img"
      aria-label={`Degrau ${degrau} de 3`}
      className={`inline-flex flex-col items-center ${className}`}
      style={{ gap: tamanho * -0.34 }}
    >
      {niveis.map((nivel) => {
        const alcancado = degrau >= nivel;
        // Só a divisa recém-conquistada acende — é a única animação
        // celebratória do app, e ela some com prefers-reduced-motion.
        const acende = animar && nivel === degrau;
        return (
          <Divisa
            key={nivel}
            tamanho={tamanho}
            className={`${alcancado ? "text-acento" : "text-tinta/25"} ${
              acende ? "animate-acender" : ""
            }`}
          />
        );
      })}
    </span>
  );
}
