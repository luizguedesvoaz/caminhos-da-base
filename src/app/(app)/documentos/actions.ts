"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type DocumentState = { error?: string; ok?: boolean };

/**
 * Grava o registro do documento. O arquivo em si já subiu direto do navegador
 * para o Storage antes desta chamada — enviar o binário por Server Action
 * gastaria banda em dobro e esbarraria no limite de tamanho do corpo.
 */
export async function saveDocument(
  _prev: DocumentState,
  formData: FormData,
): Promise<DocumentState> {
  const athleteId = String(formData.get("athleteId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const kind = String(formData.get("kind") ?? "").trim();
  const expiresOn = String(formData.get("expiresOn") ?? "").trim();
  const storagePath = String(formData.get("storagePath") ?? "").trim();
  const mimeType = String(formData.get("mimeType") ?? "").trim();

  if (!athleteId) return { error: "Nenhum atleta selecionado." };
  if (!title) return { error: "Dê um nome ao documento." };

  const supabase = await createClient();
  const { error } = await supabase.from("documents").insert({
    athlete_id: athleteId,
    title,
    kind: kind || null,
    expires_on: expiresOn || null,
    storage_path: storagePath || null,
    mime_type: mimeType || null,
  });

  if (error) {
    if (/row-level security/i.test(error.message)) {
      return { error: "Sem permissão para adicionar documentos deste atleta." };
    }
    return { error: `Erro do banco: ${error.message}` };
  }

  revalidatePath("/documentos");
  revalidatePath("/inicio");
  return { ok: true };
}

export async function deleteDocument(documentId: string, storagePath: string | null) {
  const supabase = await createClient();

  // Remove o arquivo antes do registro: se o Storage falhar, o documento
  // continua listado e o usuário pode tentar de novo, em vez de ficar com um
  // arquivo órfão que ninguém mais alcança.
  if (storagePath) {
    await supabase.storage.from("documentos").remove([storagePath]);
  }

  await supabase
    .from("documents")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", documentId);

  revalidatePath("/documentos");
  revalidatePath("/inicio");
}

/** Link temporário de visualização. O bucket é privado — nada de URL pública. */
export async function getSignedUrl(storagePath: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("documentos")
    .createSignedUrl(storagePath, 60 * 10);
  return data?.signedUrl ?? null;
}
