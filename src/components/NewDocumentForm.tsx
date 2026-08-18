"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { X, Paperclip } from "lucide-react";
import { saveDocument, type DocumentState } from "@/app/(app)/documentos/actions";
import { createClient } from "@/lib/supabase/client";
import {
  DOCUMENT_KINDS,
  ACCEPTED_TYPES,
  MAX_FILE_BYTES,
} from "@/lib/domain/documents";
import { Button, ErrorMessage, Field, inputClass } from "@/components/ui";
import { BotaoFlutuante } from "@/components/BotaoFlutuante";

export function NewDocumentForm({ athleteId }: { athleteId: string }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [storagePath, setStoragePath] = useState("");
  const [mimeType, setMimeType] = useState("");
  const [state, formAction, pending] = useActionState<DocumentState, FormData>(
    saveDocument,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setFile(null);
      setStoragePath("");
      setOpen(false);
    }
  }, [state.ok]);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;

    setUploadError(null);

    if (selected.size > MAX_FILE_BYTES) {
      setUploadError("Arquivo maior que 10 MB. Tente uma foto menor.");
      return;
    }
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setUploadError("Formato não aceito. Use foto (JPG, PNG) ou PDF.");
      return;
    }

    setUploading(true);
    setFile(selected);

    // O arquivo vai direto do navegador para o Storage. O caminho começa com
    // o id do atleta — é assim que a política de segurança do bucket decide
    // quem pode ler e escrever.
    const extension = selected.name.split(".").pop() ?? "bin";
    const path = `${athleteId}/${Date.now()}.${extension}`;

    const supabase = createClient();
    const { error } = await supabase.storage
      .from("documentos")
      .upload(path, selected, { contentType: selected.type, upsert: false });

    setUploading(false);

    if (error) {
      setFile(null);
      setUploadError(
        /bucket|not found/i.test(error.message)
          ? "O espaço de armazenamento ainda não foi criado no Supabase."
          : `Falha ao enviar: ${error.message}`,
      );
      return;
    }

    setStoragePath(path);
    setMimeType(selected.type);
  }

  if (!open) {
    return (
      <BotaoFlutuante onClick={() => setOpen(true)}>
        Novo documento
      </BotaoFlutuante>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40">
      <div className="max-h-[88dvh] w-full overflow-y-auto rounded-t-[24px] border-t-2 border-contorno bg-fundo p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-tinta">Novo documento</h2>
          <button onClick={() => setOpen(false)} aria-label="Fechar">
            <X size={22} className="text-tinta-2" aria-hidden />
          </button>
        </div>

        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="athleteId" value={athleteId} />
          <input type="hidden" name="storagePath" value={storagePath} />
          <input type="hidden" name="mimeType" value={mimeType} />

          <Field label="Tipo">
            <select name="kind" className={inputClass} defaultValue="atestado">
              {DOCUMENT_KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Nome do documento">
            <input
              name="title"
              required
              placeholder="Ex: Atestado médico 2026"
              className={inputClass}
            />
          </Field>

          <Field
            label="Vence em (opcional)"
            hint="Com a data preenchida, o app avisa 30 dias antes."
          >
            <input type="date" name="expiresOn" className={inputClass} />
          </Field>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-tinta">
              Anexo (opcional)
            </span>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-contorno p-4">
              <Paperclip size={18} className="shrink-0 text-tinta-2" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-sm text-tinta-2">
                {uploading
                  ? "Enviando…"
                  : file
                    ? file.name
                    : "Escolher foto ou PDF"}
              </span>
              <input
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                onChange={handleFile}
                className="sr-only"
              />
            </label>
            {storagePath && !uploading && (
              <p className="mt-1.5 text-xs text-emerald-700">Arquivo enviado.</p>
            )}
          </div>

          <ErrorMessage>{uploadError ?? state.error}</ErrorMessage>

          <Button type="submit" variant="gold" disabled={pending || uploading}>
            {pending ? "Salvando…" : "Salvar documento"}
          </Button>
        </form>
      </div>
    </div>
  );
}
