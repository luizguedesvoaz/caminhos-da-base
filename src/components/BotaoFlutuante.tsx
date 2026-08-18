"use client";

import { Plus } from "lucide-react";

/**
 * O botão que fica sobre o conteúdo, 16px acima da nav.
 *
 * O layout do app reserva 148px de padding inferior por causa dele — sem esse
 * espaço, o botão cobre o último item da lista. Foi um bug real do protótipo e
 * é o motivo de o espaçador viver no layout, não em cada tela.
 */
export function BotaoFlutuante({
  children,
  onClick,
  tom = "acento",
}: {
  children: React.ReactNode;
  onClick: () => void;
  /** `jogo` = ouro. Só para registrar partida — o ouro não é destaque genérico. */
  tom?: "acento" | "jogo";
}) {
  const cor =
    tom === "jogo"
      ? "bg-jogo text-jogo-tinta"
      : "bg-acento text-acento-tinta";

  return (
    <button
      onClick={onClick}
      className={`fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-1/2 z-30 flex min-h-12 -translate-x-1/2 items-center gap-2 rounded-full border-2 border-contorno px-5 py-3 text-[15px] font-bold shadow-[var(--sombra-flutuante)] ${cor}`}
    >
      <Plus size={18} strokeWidth={2.6} aria-hidden />
      {children}
    </button>
  );
}
