import { LinkButton } from "@/components/ui";
import { Pyramid } from "@/components/Pyramid";
import { BRAND } from "@/lib/config";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-between px-6 py-10">
      <div>
        <div className="mx-auto mb-10 w-52">
          <Pyramid step={3} />
        </div>

        <h1 className="text-3xl font-bold leading-tight text-tinta">
          {BRAND.name}
        </h1>
        <p className="mt-3 text-lg text-tinta-2">{BRAND.tagline}</p>

        <p className="mt-6 leading-relaxed text-tinta">
          A formação de um atleta tem três degraus — iniciação, competições e
          alto rendimento. Aqui você vê em qual deles seu filho está, o que
          falta para o próximo, e organiza treino, escola, saúde e custos num
          lugar só.
        </p>
      </div>

      <div className="mt-10 space-y-3">
        <LinkButton href="/solicitar" variant="gold">
          Solicite seu código
        </LinkButton>
        <LinkButton href="/cadastro" variant="ghost">
          Já tenho um código de convite
        </LinkButton>
        <LinkButton href="/entrar" variant="ghost">
          Já tenho conta
        </LinkButton>
      </div>
    </main>
  );
}
