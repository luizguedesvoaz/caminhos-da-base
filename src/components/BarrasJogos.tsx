/**
 * A barra de minutos jogo a jogo.
 *
 * A altura é sempre calculada contra o teto da própria série, não contra 90
 * minutos: em sub-11 o tempo de jogo é menor e uma escala fixa faria toda a
 * temporada parecer fracasso.
 *
 * Detalhe de implementação que já quebrou uma vez: a altura das barras é
 * percentual, então o contêiner PRECISA ter altura definida em pixel e as
 * barras precisam ser filhas diretas dele. Dentro de uma coluna flex de altura
 * automática, 40% de nada é nada e o gráfico renderiza vazio.
 */
export function BarrasJogos({
  jogos,
  altura = 46,
  gap = 4,
}: {
  /** Em ordem cronológica: o último item é o jogo mais recente. */
  jogos: { minutos: number; rotulo: string }[];
  altura?: number;
  gap?: number;
}) {
  if (jogos.length === 0) return null;

  const teto = Math.max(...jogos.map((j) => j.minutos), 1);
  const ultimo = jogos.length - 1;

  return (
    <div
      className="flex w-full items-end"
      style={{ height: altura, gap }}
      aria-hidden
    >
      {jogos.map((jogo, i) => {
        const banco = jogo.minutos === 0;
        // Banco tem altura mínima visível: "não entrou" é informação, e uma
        // barra de altura zero desapareceria como se o jogo não existisse.
        const fracao = banco ? 0.04 : Math.max(jogo.minutos / teto, 0.06);
        return (
          <span
            key={i}
            title={jogo.rotulo}
            className={`min-w-0 flex-1 rounded-[3px] ${
              banco
                ? "bg-alerta"
                : i === ultimo
                  ? "bg-acento"
                  : "bg-tinta/20"
            }`}
            style={{ height: `${fracao * 100}%` }}
          />
        );
      })}
    </div>
  );
}
