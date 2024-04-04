--! Previous: sha1:97ceac5a02f05bf4b7bc65c274aafa6af043c34a
--! Hash: sha1:85110fcd8f38a554f55ba3b1cc584babe6c366e7

--! split: 1-current.sql
-- Include enriched_dataset_id in the result
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
  pde.id as enriched_dataset_id
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
