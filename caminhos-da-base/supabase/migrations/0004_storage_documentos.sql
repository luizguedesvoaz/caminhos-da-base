-- ============================================================================
-- Caminhos da Base — Armazenamento de documentos
-- ============================================================================
-- Cria o espaço privado onde ficam atestados, carteirinhas e comprovantes.
--
-- Documentos de menores de idade NUNCA podem ficar públicos. O bucket é
-- privado e o acesso passa pelas mesmas regras do resto do app: cada arquivo
-- vive numa pasta com o id do atleta, e só quem tem acesso àquele atleta
-- alcança a pasta.
--
--   Caminho do arquivo:  <athlete_id>/<timestamp>-<nome>.<ext>
-- ============================================================================

-- Bucket privado, 10 MB por arquivo, apenas imagens e PDF.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documentos',
  'documentos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ----------------------------------------------------------------------------
-- Conversão segura de texto para uuid.
-- A primeira pasta do caminho deveria ser o id do atleta, mas um caminho
-- malformado não pode derrubar a política com erro de conversão — nesse caso
-- devolvemos null, e can_access_athlete simplesmente nega o acesso.
-- ----------------------------------------------------------------------------
create or replace function safe_uuid(t text)
returns uuid language plpgsql immutable as $$
begin
  return t::uuid;
exception
  when others then return null;
end;
$$;

-- ----------------------------------------------------------------------------
-- Políticas do bucket
-- ----------------------------------------------------------------------------

drop policy if exists documentos_select on storage.objects;
drop policy if exists documentos_insert on storage.objects;
drop policy if exists documentos_update on storage.objects;
drop policy if exists documentos_delete on storage.objects;

create policy documentos_select on storage.objects for select using (
  bucket_id = 'documentos'
  and can_access_athlete(auth.uid(), safe_uuid((storage.foldername(name))[1]))
);

create policy documentos_insert on storage.objects for insert with check (
  bucket_id = 'documentos'
  and can_access_athlete(auth.uid(), safe_uuid((storage.foldername(name))[1]))
);

create policy documentos_update on storage.objects for update using (
  bucket_id = 'documentos'
  and can_access_athlete(auth.uid(), safe_uuid((storage.foldername(name))[1]))
);

create policy documentos_delete on storage.objects for delete using (
  bucket_id = 'documentos'
  and can_access_athlete(auth.uid(), safe_uuid((storage.foldername(name))[1]))
);

-- ----------------------------------------------------------------------------
-- Tipo do documento, para o app sugerir prazos e nomes conhecidos.
-- ----------------------------------------------------------------------------
alter table documents add column if not exists kind text;
alter table documents add column if not exists mime_type text;

grant execute on function safe_uuid(text) to authenticated;
