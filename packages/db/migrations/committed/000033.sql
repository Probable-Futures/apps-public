--! Previous: sha1:ac6520389ba3634a6152fb0343b5f9ca9cf786a3
--! Hash: sha1:41440ff93fcf9d710864ea0498bf9a4035363e64

--! split: 1-add-timestamp-to-project-datasets.sql
alter table pf_private.pf_partner_project_datasets
  add column if not exists created_at timestamp with time zone default now();

alter table pf_private.pf_partner_project_datasets
  add column if not exists updated_at timestamp with time zone default now();

drop trigger if exists _100_timestamps on pf_private.pf_partner_project_datasets cascade;

create trigger _100_timestamps
  before insert or update on pf_private.pf_partner_project_datasets for each row
  execute function pf_private.tg__timestamps ();

--! split: 2-drop-unused.sql
drop function if exists pf_private.set_upload_id_for_dataset_enrichment ();

alter table pf_private.pf_partner_datasets
  drop column if exists upload_id cascade;

--! split: 3-use-enrich-is-true-to-start-processing-job.sql
-- add column enrich to determine if we should start the enrichment process or not
alter table pf_private.pf_partner_dataset_uploads
  add column if not exists enrich boolean default true;

drop trigger if exists _500_upload on pf_private.pf_partner_dataset_uploads cascade;

-- start the processing only if enrich is true
create or replace function pf_private.process_partner_dataset_upload ()
  returns trigger
  as $$
begin
  if new.enrich = true and TG_OP = 'INSERT' then
    perform
      graphile_worker.add_job ('process_partner_dataset', payload := json_build_object('id', (new.id), 'partnerId', (new.partner_id), 'originalFile', (new.original_file), 'partnerDatasetId', (new.partner_dataset_id), 'geodataType', (new.geodata_type)), max_attempts := 1);
  end if;
  return new;
end;
$$
language plpgsql
volatile
security definer;

-- save enrich boolean to the database with the other fields.
drop function if exists pf_public.create_partner_dataset_upload (file_url text, dataset_id uuid, geodata_type text);

create or replace function pf_public.create_partner_dataset_upload (file_url text, dataset_id uuid, geodata_type text, enrich boolean)
  returns pf_private.pf_partner_dataset_uploads
  language sql
  volatile
  security invoker
  as $$
  insert into pf_private.pf_partner_dataset_uploads (original_file, partner_dataset_id, geodata_type, partner_id, enrich)
    values (file_url, dataset_id, geodata_type, (pf_public.current_user()).id, enrich)
  returning
    *
$$;

grant all on function pf_public.create_partner_dataset_upload (file_url text, dataset_id uuid, geodata_type text, enrich boolean) to :AUTHENTICATED_ROLE;

--! split: 4-refactor_view_partner_project_datasets.sql
-- This is the main view to fetch all associated dataset uploads to a scpecific project.
-- The update here involoves returning "enrich" and "processed_with_coordinates_file".
-- Also added "order by" command, so that we keep a known order whenever this view is called.
alter table pf_private.pf_partner_dataset_uploads
  add column if not exists status text default 'requested'::text;

drop view if exists pf_public.view_partner_project_datasets;

create or replace view pf_public.view_partner_project_datasets as
select
  pp.id as project_id,
  pp.name as project_name,
  pp.description as project_description,
  pd.id as dataset_id,
  pd.name as dataset_name,
  pd.description as dataset_description,
  pdu.id as upload_id,
  pdu.original_file as original_file,
  pde.enriched_dataset_file as enriched_dataset_file,
  pdu.processed_with_coordinates_file as processed_with_coordinates_file,
  pdu.enrich as enrich,
  pdu.processed_with_coordinates_row_count as processed_with_coordinates_row_count,
  pdu.status as processing_status,
  pde.status as enrichment_status,
  pde.pf_dataset_id
from
  pf_private.pf_partner_project_datasets ppd
  join pf_private.pf_partner_projects pp on pp.id = ppd.project_id
  join pf_private.pf_partner_datasets pd on pd.id = ppd.dataset_id
  join pf_private.pf_partner_dataset_uploads pdu on pd.id = pdu.partner_dataset_id
  left join pf_private.pf_partner_dataset_enrichments pde on pdu.id = pde.upload_id
    and pd.id = pde.partner_dataset_id
where
  pp.partner_id = (pf_public.current_user()).id
order by
  ppd.created_at;

comment on view pf_public.view_partner_project_datasets is E'@foreignKey (upload_id) references pf_private.pf_partner_dataset_uploads (id)\n@foreignKey (project_id) references pf_private.pf_partner_projects (id)';

comment on column pf_public.view_partner_project_datasets.dataset_name is E'@notNull';

comment on column pf_public.view_partner_project_datasets.project_name is E'@notNull';

grant select on pf_public.view_partner_project_datasets to :AUTHENTICATED_ROLE;

--! split: 5-add-pf_dataset_id-to-projects.sql
-- now a project have its own pf_dataset_id.
-- So a project can be showing "Average temperature"
-- and the datasets inside the project can be enrihced with other climate maps
alter table pf_private.pf_partner_projects
  add column if not exists pf_dataset_id integer;

drop view if exists pf_public.view_partner_projects;

create or replace view pf_public.view_partner_projects as
select
  id,
  name,
  description,
  map_config,
  created_at,
  updated_at,
  image_url,
  pf_dataset_id
from
  pf_private.pf_partner_projects
where
  partner_id = (pf_public.current_user()).id;

comment on view pf_public.view_partner_projects is E'@primaryKey id';

comment on column pf_public.view_partner_projects.name is E'@notNull';

comment on column pf_public.view_partner_projects.created_at is E'@notNull';

grant select on pf_public.view_partner_projects to :AUTHENTICATED_ROLE;

-- For already created projects, set the new column pf_dataset_id to one of its datasets' enrichments pf_dataset_id
update
  pf_private.pf_partner_projects pp
set
  pf_dataset_id = (
    select
      pf_dataset_id
    from
      pf_private.pf_partner_dataset_enrichments pde
    where
      pde.project_id = pp.id
    limit 1);

--! split: 6-update-project-share-reponse.sql
drop type if exists pf_public.project_share_response cascade;

create type pf_public.project_share_response as (
  pf_dataset_id integer,
  map_config jsonb,
  project_datasets jsonb
);

create or replace function pf_public.project_share (slug_id uuid)
  returns pf_public.project_share_response
  language plpgsql
  strict
  security definer
  as $$
declare
  _partner_project_share pf_private.pf_partner_project_shares;
  _response pf_public.project_share_response;
begin
  select
    * into _partner_project_share
  from
    pf_private.pf_partner_project_shares
  where
    id = slug_id;
  if _partner_project_share is null then
    raise exception 'SlugId % not found', slug_id;
  end if;
  if now() > _partner_project_share.expires_at then
    raise exception 'Link is expired';
  end if;
  select
    map_config,
    pf_dataset_id into _response.map_config,
    _response.pf_dataset_id
  from
    pf_private.pf_partner_projects
  where
    id = _partner_project_share.project_id;
  with rows as (
    select
      pdu.id as upload_id,
      pdu.partner_dataset_id,
      pdu.original_file,
      pde.enriched_dataset_file,
      pdu.processed_with_coordinates_file,
      pdu.enrich,
      pde.pf_dataset_id
    from
      pf_private.pf_partner_project_datasets ppd
      join pf_private.pf_partner_dataset_uploads pdu on pdu.partner_dataset_id = ppd.dataset_id
      left join pf_private.pf_partner_dataset_enrichments pde on pdu.id = pde.upload_id
        and ppd.project_id = pde.project_id
        and ppd.dataset_id = pde.partner_dataset_id
    where
      ppd.project_id = _partner_project_share.project_id
    order by
      ppd.created_at
)
  select
    jsonb_agg(jsonb_build_object('upload_id', upload_id, 'partner_dataset_id', partner_dataset_id, 'original_file', original_file, 'enriched_dataset_file', enriched_dataset_file, 'processed_with_coordinates_file', processed_with_coordinates_file, 'enrich', enrich, 'pf_dataset_id', pf_dataset_id)) into _response.project_datasets
  from
    rows;
  return _response;
end;
$$;

grant all on function pf_public.project_share (slug_id uuid) to :VISITOR_ROLE;

grant all on function pf_public.project_share (slug_id uuid) to :AUTHENTICATED_ROLE;

--! split: 7-create-and-update-project.sql
-- use only one function to update multiple columns
drop function if exists pf_public.update_partner_project (map_config jsonb, project_id uuid);

drop function if exists pf_public.update_project_image (project_id uuid, image_url text);

create or replace function pf_public.update_partner_project (project_id uuid, map_config jsonb = null, image_url text = null, pf_dataset_id integer = null)
  returns pf_private.pf_partner_projects
  language sql
  as $$
  update
    pf_private.pf_partner_projects
  set
    map_config = coalesce(update_partner_project.map_config, map_config),
    image_url = coalesce(update_partner_project.image_url, image_url),
    pf_dataset_id = coalesce(update_partner_project.pf_dataset_id, pf_dataset_id)
  where
    id = project_id
  returning
    *;

$$;

grant all on function pf_public.update_partner_project (project_id uuid, map_config jsonb, image_url text, pf_dataset_id integer) to :AUTHENTICATED_ROLE;

-- save pf_dataset_id when a project is created.
drop function if exists pf_public.create_partner_project (name text, description text);

create or replace function pf_public.create_partner_project (name text, description text, pf_dataset_id int)
  returns pf_private.pf_partner_projects
  language sql
  as $$
  insert into pf_private.pf_partner_projects (name, description, pf_dataset_id, partner_id)
    values (name, description, pf_dataset_id, (pf_public.current_user()).id)
  returning
    *;

$$;

grant all on function pf_public.create_partner_project (name text, description text, pf_dataset_id int) to :AUTHENTICATED_ROLE;

--! split: 8-update-view_partner_datasets.sql
-- add pdu.processed_with_coordinates_file to the response
drop view if exists pf_public.view_partner_datasets;

create or replace view pf_public.view_partner_datasets as
select
  pd.id,
  pd.name,
  pd.description,
  pd.created_at,
  pd.updated_at,
  pdu.original_file,
  pdu.processed_with_coordinates_file,
  pdu.id as upload_id
from
  pf_private.pf_partner_datasets pd
  join pf_private.pf_partner_dataset_uploads pdu on pd.id = pdu.partner_dataset_id
where
  pd.partner_id = (pf_public."current_user" ()).id;

comment on view pf_public.view_partner_datasets is '@primaryKey id
@foreignKey (upload_id) references pf_private.pf_partner_dataset_uploads (id)';

comment on column pf_public.view_partner_datasets.name is '@notNull';

grant select on pf_public.view_partner_datasets to :AUTHENTICATED_ROLE;

--! split: 9-add-status-field-to-dataset-uploads.sql
-- In order to better track processing progress, add a status column pf_partner_dataset_uploads
drop view if exists pf_public.view_partner_dataset_uploads;

create view pf_public.view_partner_dataset_uploads as
select
  *
from
  pf_private.pf_partner_dataset_uploads
where (pf_partner_dataset_uploads.partner_id = (pf_public."current_user" ()).id);

comment on view pf_public.view_partner_dataset_uploads is '@primaryKey id
@foreignKey (partner_dataset_id) references pf_private.pf_partner_datasets (id)
@foreignKey (partner_dataset_id) references pf_private.pf_partner_datasets (id)';

comment on column pf_public.view_partner_dataset_uploads.original_file is '@notNull';

grant select on table pf_public.view_partner_dataset_uploads to :AUTHENTICATED_ROLE;
