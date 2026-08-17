import { createClient } from "@/lib/supabase/server";
import { EntryQueue } from "@/components/painel/EntryQueue";
import type { EntryQueueItem } from "@/lib/consultant";

export default async function EntradasPage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("list_entry_queue");

  const items = (data ?? []) as EntryQueueItem[];
  const pending = items.filter((i) => i.status === "pendente");
  const handled = items.filter((i) => i.status !== "pendente");

  return (
    <>
      <div className="mb-5">
        <h2 className="text-lg font-bold text-navy-900">Entradas</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Duas origens chegam aqui: famílias que pediram código na página
          inicial, e indicações feitas por quem já usa o app. Aprovar gera o
          código — você envia por WhatsApp.
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-navy-900">
          Aguardando ({pending.length})
        </h3>
        <EntryQueue items={pending} />
      </section>

      {handled.length > 0 && (
        <section className="mt-8">
          <h3 className="mb-3 text-sm font-semibold text-navy-900">
            Já tratadas ({handled.length})
          </h3>
          <EntryQueue items={handled} readOnly />
        </section>
      )}
    </>
  );
}
