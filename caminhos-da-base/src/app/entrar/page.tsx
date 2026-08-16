import { Suspense } from "react";
import Link from "next/link";
import { EntrarForm } from "./EntrarForm";
import { BRAND } from "@/lib/config";

export default function EntrarPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10">
      <h1 className="text-2xl font-bold text-navy-900">Entrar</h1>
      <p className="mt-2 text-muted">Bem-vindo de volta ao {BRAND.name}.</p>

      {/* useSearchParams exige Suspense para não bloquear a renderização estática */}
      <Suspense
        fallback={<div className="mt-8 h-64 animate-pulse rounded-xl bg-navy-50" />}
      >
        <EntrarForm />
      </Suspense>

      <p className="mt-6 text-center text-sm text-muted">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-semibold text-navy-900 underline">
          Cadastre-se com um convite
        </Link>
      </p>
    </main>
  );
}
