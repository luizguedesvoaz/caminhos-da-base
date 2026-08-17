"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, ErrorMessage, Field, inputClass } from "@/components/ui";

/**
 * Só aceita caminho interno como destino após o login.
 *
 * Sem esta checagem, /entrar?proximo=https://site-falso.com faria o app jogar
 * o usuário para fora depois de autenticar — o clássico "open redirect", usado
 * em golpes de phishing: o link parte do domínio real e por isso passa
 * confiança. Aqui só passa caminho que começa com uma barra, e "//" é
 * bloqueado porque o navegador o interpreta como outro domínio.
 */
function safeNext(value: string | null): string {
  if (!value) return "/inicio";
  if (!value.startsWith("/")) return "/inicio";
  if (value.startsWith("//")) return "/inicio";
  return value;
}

export function EntrarForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError("E-mail ou senha incorretos. Confira e tente de novo.");
      setLoading(false);
      return;
    }

    /**
     * BUG CORRIGIDO: antes era `router.push(destino)` seguido de
     * `router.refresh()`. As duas chamadas competiam — o refresh recarregava
     * a rota atual (/entrar) antes da navegação concluir, e como agora havia
     * sessão válida o servidor mandava para /inicio. Resultado: quem clicava
     * em Documentos, era mandado ao login e, depois de entrar, caía no início
     * em vez do destino pretendido.
     *
     * Navegação de página inteira resolve de forma definitiva: o servidor
     * recebe a requisição já com os cookies de sessão gravados, e não há
     * corrida possível entre duas navegações.
     */
    window.location.replace(safeNext(params.get("proximo")));
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <Field label="E-mail">
        <input
          type="email"
          required
          autoComplete="email"
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>

      <Field label="Senha">
        <input
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>

      <ErrorMessage>{error}</ErrorMessage>

      <Button type="submit" disabled={loading}>
        {loading ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
