import { createClient } from "@/lib/supabase/server";
import { getActiveAthlete } from "@/lib/athlete";
import { AthleteHeader } from "@/components/AthleteHeader";
import { DocumentRow } from "@/components/DocumentRow";
import { NewDocumentForm } from "@/components/NewDocumentForm";
import { FederationCard } from "@/components/FederationCard";
import { Card } from "@/components/ui";
import { byUrgency, documentStatus } from "@/lib/domain/documents";
import { currentSeason } from "@/lib/domain/category";

export default async function DocumentosPage() {
  const { athlete, all } = await getActiveAthlete();
  const supabase = await createClient();
  const season = currentSeason();

  const [{ data: documents }, { data: registrations }] = await Promise.all([
    supabase
      .from("documents")
      .select("id, title, expires_on, storage_path")
      .eq("athlete_id", athlete.id)
      .is("deleted_at", null),
    supabase
      .from("federation_registrations")
      .select("id, federation, club_name, season_year, registered_on, transfer_window_ends_on")
      .eq("athlete_id", athlete.id)
      .order("season_year", { ascending: false }),
  ]);

  const list = [...(documents ?? [])].sort(byUrgency);
  const attention = list.filter((d) => {
    const { status } = documentStatus(d.expires_on);
    return status === "vencido" || status === "vencendo";
  });

  return (
    <>
      <AthleteHeader
        athlete={athlete}
        all={all}
        subtitle="Documentos e vínculo"
      />

      <FederationCard
        athleteId={athlete.id}
        season={season}
        registrations={registrations ?? []}
      />

      {attention.length > 0 && (
        <Card className="mt-4 border-amber-300 bg-amber-50">
          <h2 className="font-semibold text-amber-900">
            {attention.length === 1
              ? "1 documento pede atenção"
              : `${attention.length} documentos pedem atenção`}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-amber-900/80">
            Documento vencido é uma das causas mais comuns de um atleta ficar
            fora de um jogo — quase sempre por esquecimento.
          </p>
        </Card>
      )}

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-navy-900">
          Documentos do atleta
        </h2>

        {list.length === 0 ? (
          <Card>
            <p className="text-sm leading-relaxed text-muted">
              Nenhum documento cadastrado. Comece pelo atestado médico e pelo
              registro na federação — são os que costumam vencer sem ninguém
              perceber.
            </p>
          </Card>
        ) : (
          <ul className="space-y-2">
            {list.map((doc) => (
              <DocumentRow
                key={doc.id}
                id={doc.id}
                title={doc.title}
                expiresOn={doc.expires_on}
                storagePath={doc.storage_path}
              />
            ))}
          </ul>
        )}
      </section>

      <NewDocumentForm athleteId={athlete.id} />
    </>
  );
}
