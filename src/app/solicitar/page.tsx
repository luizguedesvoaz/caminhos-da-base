import Link from "next/link";
import { AccessRequestForm } from "./AccessRequestForm";
import { Insignia } from "@/components/Divisa";
import { BRAND } from "@/lib/config";

export default function SolicitarPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-md px-6 py-10">
      <div className="mb-8 flex justify-center">
        <Insignia degrau={3} tamanho={56} />
      </div>

      <h1 className="text-2xl font-bold leading-tight text-tinta">
        Solicite seu código
      </h1>
      <p className="mt-2 leading-relaxed text-tinta-2">
        O {BRAND.name} é liberado por convite. Deixe seu contato que a gente
        avalia e envia o código de acesso.
      </p>

      <AccessRequestForm />

      <p className="mt-6 text-center text-sm text-tinta-2">
        Já tem um código?{" "}
        <Link href="/cadastro" className="font-semibold text-tinta underline">
          Criar conta
        </Link>
      </p>
    </main>
  );
}
