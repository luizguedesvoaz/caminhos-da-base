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
      {/* pb-24 reserva espaço para a barra fixa não cobrir o conteúdo */}
      <div className="mx-auto min-h-dvh max-w-md px-5 pb-24 pt-8">{children}</div>
      <BottomNav />
    </>
  );
}
