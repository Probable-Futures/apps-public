--! Previous: sha1:91ed3f4a1c4bf15b66a29b0af7c86db9e74c405b
--! Hash: sha1:befa2ae5088643dcaa5c28bd3898e00469084241

--! split: 1-current.sql
-- Enter migration here
alter table pf_private.pf_partner_dataset_enrichments drop column if exists enriched_file_name cascade;

drop view if exists pf_public.view_partner_dataset_enrichments;
create or replace view pf_public.view_partner_dataset_enrichments as
  select
    id,
    status,
    upload_id,
    enrichment_errors,
    enrichment_time_ms
    enriched_row_count,
    enriched_dataset_file,
    pf_dataset_id,
    project_id
 from pf_private.pf_partner_dataset_enrichments
 where partner_id = (pf_public.current_user()).id;

 comment on view pf_public.view_partner_dataset_enrichments
   is E'@primaryKey id\n@foreignKey (upload_id) references pf_private.pf_partner_dataset_uploads (id)\n';
 comment on column pf_public.view_partner_dataset_enrichments.status
   is E'@notNull';


drop view if exists pf_public.view_partner_project_datasets;
create or replace view pf_public.view_partner_project_datasets
  as select 
    pp.id as project_id,
    pp.name as project_name,
    pp.description as project_description,
    pd.id as dataset_id,
    pd.name as dataset_name,
    pd.description as dataset_description,
    pd.upload_id as upload_id,
    pdu.original_file as original_file,
    pde.enriched_dataset_file as enriched_dataset_file,
    pde.pf_dataset_id as pf_dataset_id
  from pf_private.pf_partner_project_datasets ppd
    join pf_private.pf_partner_projects pp
      on pp.id = ppd.project_id
    join pf_private.pf_partner_datasets pd
      on pd.id = ppd.dataset_id
    join pf_private.pf_partner_dataset_uploads pdu
      on pd.upload_id = pdu.id
    left join pf_private.pf_partner_dataset_enrichments pde
      on ppd.project_id = pde.project_id
  where pp.partner_id = (pf_public.current_user()).id
  and pd.partner_id = (pf_public.current_user()).id;

comment on view pf_public.view_partner_project_datasets
  is E'@foreignKey (upload_id) references pf_private.pf_partner_dataset_uploads (id)\n@foreignKey (project_id) references pf_private.pf_partner_projects (id)';
comment on column pf_public.view_partner_project_datasets.dataset_name
  is E'@notNull';
comment on column pf_public.view_partner_project_datasets.project_name
  is E'@notNull';

drop function if exists pf_public.create_partner_dataset_enrichment(
  pf_dataset_id integer,
  partner_dataset_id uuid,
  upload_id uuid,
  project_id uuid, enriched_file_name text);
create or replace function pf_public.create_partner_dataset_enrichment(
  pf_dataset_id integer,
  partner_dataset_id uuid,
  upload_id uuid,
  project_id uuid
) returns pf_private.pf_partner_dataset_enrichments
  language sql volatile security invoker
as $$
  insert into pf_private.pf_partner_dataset_enrichments
    (pf_dataset_id, partner_dataset_id, upload_id, project_id, partner_id)
  values
    (pf_dataset_id, partner_dataset_id, upload_id, project_id, (pf_public.current_user()).id)
  returning *;
$$;

grant select on pf_public.view_partner_dataset_enrichments to :AUTHENTICATED_ROLE;
grant select on pf_public.view_partner_project_datasets to :AUTHENTICATED_ROLE;
grant all on function pf_public.create_partner_dataset_enrichment(pf_dataset_id integer, partner_dataset_id uuid, upload_id uuid, project_id uuid)
  to :AUTHENTICATED_ROLE;
