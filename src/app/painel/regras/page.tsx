import { createClient } from "@/lib/supabase/server";
import { CompetitionEditor } from "@/components/painel/CompetitionEditor";
import { STEPS } from "@/lib/domain/pyramid";

export default async function RegrasPage() {
  const supabase = await createClient();

  const [{ data: competitions }, { data: rules }] = await Promise.all([
    supabase
      .from("competitions")
      .select("id, name, state, step_level")
      .order("step_level", { ascending: false })
      .order("name"),
    supabase
      .from("pyramid_rules")
      .select("id, step, state, label, criteria, is_active")
      .eq("is_active", true)
      .order("step"),
  ]);

  return (
    <>
      <div className="mb-5">
        <h2 className="text-lg font-bold text-tinta">
          Regras da pirâmide
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-tinta-2">
          O degrau de cada atleta é calculado pela competição que ele disputa. A
          tabela abaixo é o que o sistema consulta — editar aqui muda o
          diagnóstico de todos, sem precisar de programador.
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-contorno bg-fundo p-5">
        <h3 className="text-sm font-semibold text-tinta">
          Como o cálculo funciona
        </h3>
        <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-tinta-2">
          <li>
            <strong className="text-tinta">Degrau 3 — {STEPS[3].name}:</strong> o
            atleta disputa alguma competição marcada como degrau 3, ou está em
            clube com Certificado de Clube Formador.
          </li>
          <li>
            <strong className="text-tinta">Degrau 2 — {STEPS[2].name}:</strong> a
            competição de maior nível que ele disputa está marcada como degrau 2.
          </li>
          <li>
            <strong className="text-tinta">Degrau 1 — {STEPS[1].name}:</strong>
            {" "}
            nenhuma competição registrada.
          </li>
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-tinta-2">
          Vale sempre o degrau mais alto entre as competições do atleta. Um
          ajuste manual na ficha do atleta tem prioridade sobre o cálculo
          automático, e fica registrado com motivo e data.
        </p>
      </div>

      {rules && rules.length > 0 && (
        <div className="mb-6 rounded-2xl border border-contorno bg-fundo p-5">
          <h3 className="text-sm font-semibold text-tinta">
            Critérios cadastrados
          </h3>
          <ul className="mt-3 space-y-2">
            {rules.map((rule) => (
              <li key={rule.id} className="text-sm">
                <span className="font-semibold text-tinta">
                  Degrau {rule.step}
                </span>
                {rule.state && (
                  <span className="ml-1.5 rounded-full bg-fundo-2 px-2 py-0.5 text-xs text-tinta">
                    {rule.state}
                  </span>
                )}
                <span className="ml-1.5 text-tinta-2">{rule.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <CompetitionEditor competitions={competitions ?? []} />
    </>
  );
}
