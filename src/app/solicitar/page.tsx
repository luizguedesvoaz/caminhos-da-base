import Link from "next/link";
import { AccessRequestForm } from "./AccessRequestForm";
import { Pyramid } from "@/components/Pyramid";
import { BRAND } from "@/lib/config";

export default function SolicitarPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-md px-6 py-10">
      <div className="mx-auto mb-8 w-40">
        <Pyramid step={3} size="small" />
      </div>

      <h1 className="text-2xl font-bold leading-tight text-navy-900">
        Solicite seu código
      </h1>
      <p className="mt-2 leading-relaxed text-muted">
        O {BRAND.name} é liberado por convite. Deixe seu contato que a gente
        avalia e envia o código de acesso.
      </p>

      <AccessRequestForm />

      <p className="mt-6 text-center text-sm text-muted">
        Já tem um código?{" "}
        <Link href="/cadastro" className="font-semibold text-navy-900 underline">
          Criar conta
        </Link>
      </p>
    </main>
  );
}
