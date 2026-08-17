"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, ErrorMessage, Field, inputClass } from "@/components/ui";
import { BRAND, CONSENT_VERSION } from "@/lib/config";

export default function CadastroPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    code: "",
    fullName: "",
    email: "",
    password: "",
  });
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    // 1. O código é validado ANTES de criar a conta, para não deixar
    //    usuário órfão no auth caso o convite seja inválido.
    const { data: valid, error: rpcError } = await supabase.rpc(
      "validate_invite_code",
      { p_code: form.code },
    );

    if (rpcError || !valid) {
      setError("Código de convite inválido ou já utilizado.");
      setLoading(false);
      return;
    }

    // 2. Cria a conta. O trigger no banco cria perfil e assinatura.
    const { data: signUp, error: signUpError } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: { data: { full_name: form.fullName.trim(), role: "responsavel" } },
    });

    if (signUpError) {
      setError(
        signUpError.message.includes("already")
          ? "Já existe uma conta com este e-mail."
          : "Não foi possível criar a conta. Tente novamente.",
      );
      setLoading(false);
      return;
    }

    // 3. Consome o convite e registra o aceite de LGPD.
    //    Dado de menor de idade exige consentimento versionado e datado.
    if (signUp.user) {
      await supabase.rpc("consume_invite_code", { p_code: form.code });
      await supabase
        .from("consents")
        .insert({ user_id: signUp.user.id, version: CONSENT_VERSION });
    }

    router.push("/onboarding");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10">
      <h1 className="text-2xl font-bold text-navy-900">Criar conta</h1>
      <p className="mt-2 text-muted">
        O {BRAND.name} é fechado por convite. Use o código que você recebeu.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Field label="Código de convite">
          <input
            required
            placeholder="BASE-2026-001"
            className={`${inputClass} uppercase tracking-wide`}
            value={form.code}
            onChange={update("code")}
          />
        </Field>

        <Field label="Seu nome completo">
          <input
            required
            autoComplete="name"
            className={inputClass}
            value={form.fullName}
            onChange={update("fullName")}
          />
        </Field>

        <Field label="E-mail">
          <input
            type="email"
            required
            autoComplete="email"
            className={inputClass}
            value={form.email}
            onChange={update("email")}
          />
        </Field>

        <Field label="Senha" hint="Use pelo menos 8 caracteres.">
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
            value={form.password}
            onChange={update("password")}
          />
        </Field>

        <label className="flex items-start gap-3 rounded-xl bg-navy-50 p-4">
          <input
            type="checkbox"
            required
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 size-5 shrink-0 accent-navy-900"
          />
          <span className="text-sm leading-relaxed text-ink">
            Sou responsável legal pelo atleta e autorizo o tratamento dos dados
            dele conforme a{" "}
            <Link href="/privacidade" className="underline">
              Política de Privacidade
            </Link>
            .
          </span>
        </label>

        <ErrorMessage>{error}</ErrorMessage>

        <Button type="submit" variant="gold" disabled={loading || !consent}>
          {loading ? "Criando conta…" : "Criar conta"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-semibold text-navy-900 underline">
          Entrar
        </Link>
      </p>
    </main>
  );
}
