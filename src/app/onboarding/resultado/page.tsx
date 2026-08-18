import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Pyramid } from "@/components/Pyramid";
import { Insignia } from "@/components/Divisa";
import { Bloco, BotaoLink, Rotulo } from "@/components/ui";
import { STEPS, NEXT_STEP_CHECKLIST, type Step } from "@/lib/domain/pyramid";
import {
  categoryFor,
  categoryLabel,
  categoryYear,
  categoryYearExplanation,
  currentSeason,
} from "@/lib/domain/category";

export default async function ResultadoPage({
  searchParams,
}: {
  searchParams: Promise<{ atleta?: string }>;
}) {
  const { atleta } = await searchParams;
  if (!atleta) redirect("/onboarding");

  const supabase = await createClient();

  const { data: athlete } = await supabase
    .from("athletes")
    .select("id, full_name, birth_year")
    .eq("id", atleta)
    .single();

  if (!athlete) redirect("/onboarding");

  // Degrau calculado no servidor pela engine — nunca no navegador.
  const { data: evaluation } = await supabase
    .rpc("current_pyramid_step", { p_athlete_id: atleta })
    .single<{ step: number; reason: string }>();

  const step = (evaluation?.step ?? 1) as Step;
  const season = currentSeason();
  const category = categoryFor(athlete.birth_year, season);
  const yearInCategory = categoryYear(athlete.birth_year, season);
  const firstName = athlete.full_name.split(" ")[0];

  return (
    <main className="relative mx-auto min-h-dvh max-w-md px-[22px] py-10">
      {/* No escuro, o limão vira luz de estádio entrando por cima da tela. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 hidden h-64 dark:block"
        style={{
          backgroundImage:
            "radial-gradient(120% 60% at 50% 0%, rgb(184 230 0 / .10), transparent 70%)",
        }}
      />

      <div className="relative">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-full border-2 border-acento px-3 py-1 text-xs font-bold uppercase tracking-[.16em] text-tinta">
            Degrau desbloqueado
          </span>
          <Insignia degrau={step} tamanho={20} animar />
        </div>

        <h1 className="mt-4 font-display text-[54px] font-extrabold leading-[.9] tracking-[-.04em] text-tinta">
          Você está no degrau{" "}
          <span className="text-acento-texto">{step}</span> de 3
        </h1>

        <p className="mt-3 text-[17px] leading-relaxed text-tinta-2">
          {firstName} está em {STEPS[step].name}. {STEPS[step].meaning}
        </p>

        <div className="mt-7">
          <Pyramid
            step={step}
            tamanho="revelacao"
            motivo={evaluation?.reason ?? null}
          />
        </div>

        {step < 3 && (
          <Bloco enfase="destaque" className="mt-7 overflow-hidden p-0">
            <div className="bg-marinho-fundo px-4 py-2.5">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-jogo">
                Missões para o degrau {step + 1}
              </p>
            </div>
            <ul className="divide-y-2 divide-contorno">
              {NEXT_STEP_CHECKLIST[step].slice(0, 3).map((item) => (
                <li key={item} className="flex gap-3 px-4 py-3.5">
                  <span
                    aria-hidden
                    className="mt-1 size-2.5 shrink-0 rounded-full bg-acento"
                  />
                  <span className="text-[14px] leading-relaxed text-tinta">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </Bloco>
        )}

        {/* "Vale saber": a barra de ouro na lateral é cabeçalho institucional,
            não destaque de partida — mesmo uso do cabeçalho do degrau. */}
        <div className="mt-6 border-l-[3px] border-jogo pl-4">
          <Rotulo>Vale saber</Rotulo>
          <p className="mt-1.5 text-[14px] leading-relaxed text-tinta-2">
            Categoria em {season}: {categoryLabel(category)}.{" "}
            {categoryYearExplanation(yearInCategory, category)}
          </p>
        </div>

        <div className="mt-8">
          <BotaoLink href="/inicio" prefetch={false} variante="acento">
            Bora começar
          </BotaoLink>
        </div>
      </div>
    </main>
  );
}
