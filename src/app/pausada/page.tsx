import Link from "next/link";
import { PauseCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BRAND } from "@/lib/config";

export default async function PausadaPage() {
  const supabase = await createClient();
  const { data: blocked } = await supabase.rpc("is_my_account_blocked");

  // Reativada enquanto a página estava aberta: devolve ao app.
  if (blocked !== true) redirect("/inicio");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("blocked_reason")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10 text-center">
      <PauseCircle size={44} className="mx-auto text-tinta" aria-hidden />

      <h1 className="mt-4 text-2xl font-bold text-tinta">
        Seu acesso está pausado
      </h1>

      <p className="mt-3 leading-relaxed text-tinta-2">
        O acesso ao {BRAND.name} está temporariamente suspenso.{" "}
        <strong className="text-tinta">
          Nenhum dado do seu atleta foi apagado
        </strong>{" "}
        — tarefas, gastos, jogos e documentos continuam guardados e voltam
        exatamente como estavam.
      </p>

      {profile?.blocked_reason && (
        <p className="mt-4 rounded-xl bg-fundo-2 p-4 text-sm text-tinta">
          {profile.blocked_reason}
        </p>
      )}

      <a
        href={BRAND.consultantContactUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex items-center justify-center rounded-xl bg-marinho-fundo px-5 py-3.5 font-semibold text-white"
      >
        Falar com o consultor
      </a>

      <Link href="/sair" prefetch={false} className="mt-4 text-sm text-tinta-2 underline">
        Sair da conta
      </Link>
    </main>
  );
}
