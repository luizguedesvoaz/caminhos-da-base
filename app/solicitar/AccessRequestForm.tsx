"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import {
  submitAccessRequest,
  type AccessRequestState,
} from "./actions";
import { Button, ErrorMessage, Field, inputClass } from "@/components/ui";
import { currentSeason } from "@/lib/domain/category";

const SOURCES = [
  "Palestra",
  "Indicação de outro pai",
  "Instagram",
  "Escolinha ou clube",
  "Outro",
];

export function AccessRequestForm() {
  const [state, formAction, pending] = useActionState<
    AccessRequestState,
    FormData
  >(submitAccessRequest, {});

  const season = currentSeason();
  const years = Array.from({ length: 16 }, (_, i) => season - 5 - i);

  if (state.ok) {
    return (
      <div className="mt-8 rounded-2xl bg-emerald-50 p-6 text-center">
        <CheckCircle2
          size={40}
          className="mx-auto text-emerald-700"
          aria-hidden
        />
        <h2 className="mt-3 text-lg font-bold text-emerald-900">
          Solicitação enviada
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-emerald-800">
          Vamos avaliar e entrar em contato pelo telefone que você deixou, com o
          código de acesso.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-sm font-semibold text-emerald-900 underline"
        >
          Voltar ao início
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <Field label="Seu nome completo">
        <input name="fullName" required autoComplete="name" className={inputClass} />
      </Field>

      <Field label="WhatsApp com DDD" hint="É por aqui que enviamos o código.">
        <input
          name="phone"
          required
          inputMode="tel"
          autoComplete="tel"
          placeholder="11 91234-5678"
          className={inputClass}
        />
      </Field>

      <Field label="E-mail (opcional)">
        <input
          name="email"
          type="email"
          autoComplete="email"
          className={inputClass}
        />
      </Field>

      <Field label="Nome do atleta (opcional)">
        <input name="athleteName" className={inputClass} />
      </Field>

      <Field label="Ano de nascimento do atleta (opcional)">
        <select name="birthYear" className={inputClass} defaultValue="">
          <option value="">Prefiro informar depois</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Cidade">
          <input name="city" className={inputClass} />
        </Field>
        <Field label="Clube ou escolinha">
          <input name="clubName" className={inputClass} />
        </Field>
      </div>

      <Field label="Como conheceu o app?">
        <select name="source" className={inputClass} defaultValue="">
          <option value="">Prefiro não dizer</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Quer contar algo sobre o momento do seu filho? (opcional)">
        <input
          name="note"
          placeholder="Ex: vai fazer teste no mês que vem"
          className={inputClass}
        />
      </Field>

      <label className="flex items-start gap-3 rounded-xl bg-navy-50 p-4">
        <input
          type="checkbox"
          name="consent"
          value="1"
          required
          className="mt-0.5 size-5 shrink-0 accent-navy-900"
        />
        <span className="text-sm leading-relaxed text-ink">
          Autorizo o contato e o tratamento dos meus dados conforme a{" "}
          <Link href="/privacidade" className="underline">
            Política de Privacidade
          </Link>
          .
        </span>
      </label>

      <ErrorMessage>{state.error}</ErrorMessage>

      <Button type="submit" variant="gold" disabled={pending}>
        {pending ? "Enviando…" : "Solicitar código"}
      </Button>
    </form>
  );
}
