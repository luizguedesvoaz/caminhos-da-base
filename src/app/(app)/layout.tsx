import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /**
   * Conta pausada não entra no app.
   *
   * A verificação fica no layout, e não em cada página, para não haver tela
   * esquecida sem a checagem. Pausar não apaga nada — o acervo da família
   * continua guardado e volta quando o consultor reativa.
   */
  const supabase = await createClient();
  const { data: blocked } = await supabase.rpc("is_my_account_blocked");
  if (blocked === true) redirect("/pausada");

  return (
    <>
      {/* O padding inferior reserva espaço para a nav fixa E para o botão
          flutuante que fica 16px acima dela — sem isso o botão cobre o último
          item da lista, que foi um bug real do protótipo. */}
      <div className="mx-auto min-h-dvh max-w-md px-[22px] pb-[148px] pt-8">
        {children}
      </div>
      <BottomNav />
    </>
  );
}
