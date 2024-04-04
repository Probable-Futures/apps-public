--! Previous: sha1:6d00184c960d8ac026e3396458b8f4f9cbb39e11
--! Hash: sha1:cec7cbfc27741dc4f55e9ee5dc21883aa2340b16

--! split: 1-current.sql
-- Enter migration here
alter table pf_private.pf_partner_dataset_uploads 
  add column if not exists geodata_type text default 'latLon';

drop function if exists pf_public.create_partner_dataset_upload(
  file_url text,
  dataset_id uuid
);
create or replace function pf_public.create_partner_dataset_upload(
  file_url text,
  dataset_id uuid,
  geodata_type text
) returns pf_private.pf_partner_dataset_uploads
language sql volatile security invoker
as $$
    insert into pf_private.pf_partner_dataset_uploads
      (original_file, partner_dataset_id, geodata_type, partner_id)
    values
      (file_url, dataset_id, geodata_type, (pf_public.current_user()).id)
    returning *
$$;

create or replace function pf_private.process_partner_dataset_upload()
  returns trigger AS $$
begin
  update pf_private.pf_partner_datasets set upload_id = NEW.id where id = NEW.partner_dataset_id;
  PERFORM graphile_worker.add_job('process_partner_dataset',
    payload := json_build_object(
    'id', (NEW.id),
    'partnerId', (NEW.partner_id),
    'originalFile', (NEW.original_file),
    'partnerDatasetId', (NEW.partner_dataset_id),
    'geodataType', (NEW.geodata_type)),
    max_attempts := 1);
  return new;
end;
$$ language plpgsql volatile security definer;

grant all on function pf_public.create_partner_dataset_upload(file_url text, dataset_id uuid, geodata_type text)
  to :AUTHENTICATED_ROLE;
