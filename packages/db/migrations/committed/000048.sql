--! Previous: sha1:653ec0df1f51e202bfe4aa899fd98cff9a1025e8
--! Hash: sha1:ad1013a1798f69654623168e995d9a6e602aa416

--! split: 1-current.sql
drop function if exists pf_public.update_partner_dataset (dataset_name text, dataset_id uuid);

create or replace function pf_public.update_partner_dataset (dataset_name text, dataset_id uuid)
  returns pf_private.pf_partner_datasets
  language sql
  as $$
  update
    pf_private.pf_partner_datasets
  set
    name = dataset_name
  where
    id = dataset_id
  returning
    *;

$$;

grant all on function pf_public.update_partner_dataset (dataset_name text, dataset_id uuid) to :AUTHENTICATED_ROLE;

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
  pde.pf_dataset_id,
  pde.id as enriched_dataset_id,
  pd.is_example as is_example
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
